const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../utils/logger');

if (!process.env.SUPABASE_JWT_SECRET) {
  logger.error('BŁĄD: Brak zmiennej środowiskowej SUPABASE_JWT_SECRET');
  process.exit(1);
}

module.exports = async (req, res, next) => {
  // Pomiń autoryzację dla OPTIONS
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.debug('Brak tokena w request headers');
    return res.status(401).json({ error: 'Brak tokena autoryzacyjnego' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Weryfikacja tokena z użyciem JWT_SECRET
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
      algorithms: ['HS256']
    });
    
    // Sprawdź czy użytkownik istnieje w MongoDB
    let user = await User.findOne({ supabaseId: decoded.sub });

    // Jeśli użytkownik nie istnieje, utwórz go
    if (!user) {
      logger.info(`Tworzenie nowego użytkownika w MongoDB dla Supabase ID: ${decoded.sub}`);
      
      // Przygotuj dane użytkownika z tokena
      const userData = {
        supabaseId: decoded.sub,
        email: decoded.email,
        name: decoded.user_metadata?.full_name || decoded.email.split('@')[0],
        notificationPreferences: {
          channels: {
            email: {
              enabled: true,
              verified: decoded.email_verified || false
            },
            push: {
              enabled: true,
              subscriptions: []
            }
          }
        }
      };

      try {
        user = await User.create(userData);
        logger.info(`Utworzono nowego użytkownika w MongoDB: ${user._id}`);
      } catch (createError) {
        logger.error('Błąd podczas tworzenia użytkownika:', createError);
        return res.status(500).json({ 
          error: 'Błąd podczas tworzenia konta użytkownika',
          details: process.env.NODE_ENV === 'development' ? createError.message : undefined
        });
      }
    }

    // Dodaj dane użytkownika do requestu
    req.user = {
      ...decoded,
      _id: user._id,
      mongoUser: user
    };
    
    next();
  } catch (err) {
    logger.error('Błąd weryfikacji tokena:', {
      name: err.name,
      message: err.message,
      expiredAt: err.expiredAt
    });

    return res.status(401).json({ 
      error: 'Nieprawidłowy lub wygasły token',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
