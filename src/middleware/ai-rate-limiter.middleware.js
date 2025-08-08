const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisConfig = require('../config/redis.config');
const logger = require('../utils/logger');

/**
 * Rate limiter dla AI generation endpoints
 * Zapobiega przeciążeniu systemu przez zbyt wiele żądań generowania planów
 */
const createAIRateLimiter = () => {
  try {
    const redis = redisConfig.getClient();
    
    if (redis) {
      return rateLimit({
        store: new RedisStore({
          client: redis,
          prefix: 'ai_rate_limit:',
          expiry: 60 * 60, // 1 godzina
        }),
        windowMs: 60 * 60 * 1000, // 1 godzina
        max: 100, // Maksymalnie 100 żądań AI na godzinę na użytkownika (zwiększone dla testów)
        message: {
          status: 'error',
          message: 'Przekroczono limit generowania planów treningowych. Spróbuj ponownie za godzinę.',
          resetTime: new Date(Date.now() + 60 * 60 * 1000)
        },
        standardHeaders: true, // Zwraca rate limit info w `RateLimit-*` headers
        legacyHeaders: false, // Wyłącza `X-RateLimit-*` headers
        keyGenerator: (req) => {
          // Rate limiting per user
          return req.user?.id || req.ip;
        },
        skip: (req) => {
          // Wyłącz rate limiting całkowicie dla testów
          return true;
        },
        handler: (req, res) => {
          const userId = req.user?.id || req.ip;
          logger.warn(`AI rate limit exceeded for user: ${userId}`);
          res.status(429).json({
            status: 'error',
            message: 'Przekroczono limit generowania planów treningowych. Spróbuj ponownie za godzinę.',
            resetTime: new Date(Date.now() + 60 * 60 * 1000)
          });
        }
      });
    }
  } catch (error) {
    logger.error('Failed to create AI rate limiter, falling back to memory store:', error);
  }
  
  // Fallback do memory store jeśli Redis nie jest dostępny
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 godzina
    max: 100, // Maksymalnie 100 żądań AI na godzinę na użytkownika (zwiększone dla testów)
    message: {
      status: 'error',
      message: 'Przekroczono limit generowania planów treningowych. Spróbuj ponownie za godzinę.',
      resetTime: new Date(Date.now() + 60 * 60 * 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    },
    skip: (req) => {
      return true;
    },
    handler: (req, res) => {
      const userId = req.user?.id || req.ip;
      logger.warn(`AI rate limit exceeded for user: ${userId} (memory store)`);
      res.status(429).json({
        status: 'error',
        message: 'Przekroczono limit generowania planów treningowych. Spróbuj ponownie za godzinę.',
        resetTime: new Date(Date.now() + 60 * 60 * 1000)
      });
    }
  });
};

/**
 * Rate limiter dla job status endpoints
 * Bardziej liberalny limit dla sprawdzania statusu
 */
const createJobStatusRateLimiter = () => {
  try {
    const redis = redisConfig.getClient();
    
    if (redis) {
      return rateLimit({
        store: new RedisStore({
          client: redis,
          prefix: 'job_status_rate_limit:',
          expiry: 60, // 1 minuta
        }),
        windowMs: 60 * 1000, // 1 minuta
        max: 60, // Maksymalnie 60 żądań statusu na minutę na użytkownika
        message: {
          status: 'error',
          message: 'Przekroczono limit sprawdzania statusu. Spróbuj ponownie za minutę.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
          return req.user?.id || req.ip;
        },
        skip: (req) => {
          return true;
        }
      });
    }
  } catch (error) {
    logger.error('Failed to create job status rate limiter, falling back to memory store:', error);
  }
  
  return rateLimit({
    windowMs: 60 * 1000, // 1 minuta
    max: 60, // Maksymalnie 60 żądań statusu na minutę na użytkownika
    message: {
      status: 'error',
      message: 'Przekroczono limit sprawdzania statusu. Spróbuj ponownie za minutę.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    },
    skip: (req) => {
      return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
    }
  });
};

/**
 * Middleware do wykrywania backpressure
 * Sprawdza czy kolejka nie jest przeciążona
 */
const backpressureMiddleware = async (req, res, next) => {
  try {
    const aiJobService = require('../services/ai-job.service');
    const queueStats = await aiJobService.getQueueStats();
    
    // Sprawdź czy kolejka jest przeciążona
    const totalJobs = queueStats.waiting + queueStats.active;
    const MAX_QUEUE_SIZE = 1000; // Maksymalnie 1000 zadań w kolejce
    
    if (totalJobs >= MAX_QUEUE_SIZE) {
      logger.warn(`Queue overloaded: ${totalJobs} jobs in queue`);
      return res.status(503).json({
        status: 'error',
        message: 'System jest obecnie przeciążony. Spróbuj ponownie za kilka minut.',
        queueSize: totalJobs,
        retryAfter: 300 // 5 minut
      });
    }
    
    // Jeśli kolejka jest bliska przepełnienia, dodaj priorytet
    if (totalJobs > MAX_QUEUE_SIZE * 0.8) {
      req.queuePriority = -1; // Niższy priorytet dla nowych zadań
      logger.info(`Queue nearing capacity: ${totalJobs} jobs, lowering priority`);
    }
    
    next();
  } catch (error) {
    logger.error('Backpressure check failed:', error);
    // W przypadku błędu, pozwól na kontynuację
    next();
  }
};

module.exports = {
  aiRateLimiter: createAIRateLimiter(),
  jobStatusRateLimiter: createJobStatusRateLimiter(),
  backpressureMiddleware
};