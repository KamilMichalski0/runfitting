const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUI = require('swagger-ui-express');
const dotenv = require('dotenv');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const compression = require('compression');

// Import nowej konfiguracji Swagger
const swaggerSpec = require('./config/swaggerConfig');

// Import routes
console.log('[APP] Importing user routes...');
const userRoutes = require('./routes/user.routes');
console.log('[APP] User routes imported successfully:', typeof userRoutes);

const planRoutes = require('./routes/plan.routes');

const runningFormRoutes = require('./routes/running-form.routes');
const weeklyScheduleRoutes = require('./routes/weekly-schedule.routes');
const notificationRoutes = require('./routes/notification.routes');
const monitoringRoutes = require('./routes/monitoring.routes');

// Importowanie middleware obsługi błędów
const globalErrorHandler = require('./middleware/error.middleware');
const AppError = require('./utils/app-error');

// Import konfiguracji bazy danych
const { connectDB } = require('./config/database');
const aiJobService = require('./services/ai-job.service');
const sseNotificationService = require('./services/sse-notification.service');

// Konfiguracja środowiska
dotenv.config();

// Set instance ID if not provided
if (!process.env.INSTANCE_ID) {
  process.env.INSTANCE_ID = require('crypto').randomBytes(4).toString('hex');
}

// Inicjalizacja aplikacji Express
const app = express();

// Konfiguracja trust proxy
// WAŻNE: Dostosuj tę wartość do swojego środowiska deploymentu!
// 1 oznacza, że aplikacja ufa jednemu reverse proxy przed nią (np. Nginx, Heroku).
// Jeśli aplikacja jest wystawiona bezpośrednio, ustaw 'false'.
// Jeśli jest więcej proxy, ustaw odpowiednią liczbę.
// Zobacz: https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', 1); 

// Endpointy dokumentacji API (używające nowej konfiguracji z swaggerSpec)
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// CORS musi być pierwszym middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:3002', 'http://localhost:3000', 'https://app.znanytrener.ai'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Dodatkowa konfiguracja nagłówków dla CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  const origin = req.headers.origin;
  if (origin && ['http://localhost:3001', 'https://app.znanytrener.ai'].includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  next();
});

// Middleware bezpieczeństwa
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
app.use(xss()); // Sanityzuje dane wejściowe

// Usunięto globalne stosowanie supabaseAuth - jest teraz w routerach

// Health check endpoint (przed rate limiterem)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'RunFitting API',
    version: '1.0.0'
  });
});

// Ograniczenie liczby żądań (po health check)
const limiter = rateLimit({
  max: 100, // Maksymalna liczba żądań
  windowMs: 60 * 60 * 1000, // 1 godzina
  message: 'Zbyt wiele żądań z tego adresu IP, spróbuj ponownie za godzinę!',
  skip: (req) => {
    // Pomijaj rate limiting dla health check (dodatkowa ochrona)
    return req.path === '/api/health';
  }
});
app.use('/api', limiter);

// Parsowanie ciała żądania
app.use(express.json({ limit: '10kb' })); // Body parser, limit 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // Parse cookies
app.use(mongoSanitize()); // Zabezpieczenie przed NoSQL injection
app.use(compression()); // Kompresja odpowiedzi

// Logowanie w trybie deweloperskim
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Instance tracking middleware
app.use((req, res, next) => {
  // Add instance ID to all responses
  res.setHeader('X-Instance-ID', process.env.INSTANCE_ID);
  
  // Log high-level request info for debugging multiple instances
  if (req.method !== 'OPTIONS' && req.path.startsWith('/api/')) {
    console.log(`[${process.env.INSTANCE_ID}] ${req.method} ${req.path}`);
  }
  
  next();
});

// Routing (without extra middleware for now)
console.log('[APP] Registering user routes at /api/users');
app.use('/api/users', userRoutes);

// DEBUG: Print all registered routes
console.log('[APP] All registered routes:');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`  ${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log(`  ${Object.keys(handler.route.methods).join(',').toUpperCase()} ${middleware.regexp.source}${handler.route.path}`);
      }
    });
  }
});
app.use('/api/plans', planRoutes);
app.use('/api/running-forms', runningFormRoutes);
app.use('/api/weekly-schedule', weeklyScheduleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Testowy endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API RunFitting działa prawidłowo!'
  });
});

// Obsługa błędnych ścieżek
app.all('*', (req, res, next) => {
  next(new AppError(`Nie można znaleźć ${req.originalUrl} na tym serwerze!`, 404));
});

// Middleware obsługi błędów
app.use(globalErrorHandler);

// Połączenie z bazą danych MongoDB tylko poza środowiskiem testowym
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  
  // Inicjalizacja AI Job Service z Redis queue
  aiJobService.initialize().catch(err => {
    console.error('Failed to initialize AI Job Service:', err);
  });
}

// Graceful shutdown dla SSE connections
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing SSE connections...');
  sseNotificationService.closeAllConnections();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing SSE connections...');
  sseNotificationService.closeAllConnections();
  process.exit(0);
});

// Konfiguracja portu i uruchomienie serwera
const PORT = process.env.PORT || 3002;

module.exports = app; 