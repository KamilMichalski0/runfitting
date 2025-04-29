const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const dotenv = require('dotenv');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const compression = require('compression');

// Import nowej konfiguracji Swagger
const swaggerSpec = require('./config/swaggerConfig');

// Import routes
const userRoutes = require('./routes/user.routes');

// --- DEBUG LOG in app.js BEFORE plan.routes ---
console.log('APP_DEBUG: Attempting to require plan.routes.js...');
const planRoutes = require('./routes/plan.routes');
console.log('APP_DEBUG: Successfully required plan.routes.js');
// --- END DEBUG LOG ---

const runningFormRoutes = require('./routes/running-form.routes');

// Importowanie middleware obsługi błędów
const globalErrorHandler = require('./middleware/error.middleware');
const AppError = require('./utils/app-error');
const supabaseAuth = require('./middleware/supabaseAuth.middleware');

// Import konfiguracji bazy danych
const { connectDB } = require('./config/database');

// Konfiguracja środowiska
dotenv.config();

// Inicjalizacja aplikacji Express
const app = express();

// Konfiguracja trust proxy
app.set('trust proxy', true); // Ufaj wszystkim proxy
// lub bardziej precyzyjna konfiguracja:
// app.set('trust proxy', 1); // Ufaj tylko pierwszemu proxy
// app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']); // Ufaj tylko określonym adresom

// Endpointy dokumentacji API (używające nowej konfiguracji z swaggerSpec)
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// CORS musi być pierwszym middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:3001', 'https://app.znanytrener.ai'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// Ograniczenie liczby żądań
const limiter = rateLimit({
  max: 100, // Maksymalna liczba żądań
  windowMs: 60 * 60 * 1000, // 1 godzina
  message: 'Zbyt wiele żądań z tego adresu IP, spróbuj ponownie za godzinę!'
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

// Routing
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/running-forms', runningFormRoutes);

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
}

// Konfiguracja portu i uruchomienie serwera
const PORT = process.env.PORT || 3002;

module.exports = app; 