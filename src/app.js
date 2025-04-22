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

// Import routes
const userRoutes = require('./routes/user.routes');
const planRoutes = require('./routes/plan.routes');
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

// Konfiguracja Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RunFitting API',
      version: '1.0.0',
      description: 'API do aplikacji planowania treningów biegowych',
      contact: {
        name: 'Wsparcie API',
        email: 'support@runfitting.pl',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serwer lokalny',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Endpointy dokumentacji PUBLICZNE
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// CORS musi być pierwszym middleware
app.use(cors({
  origin: 'http://localhost:3000',  // Twój frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type']
}));

// Dodatkowa konfiguracja nagłówków dla CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.headers.origin === 'http://localhost:3000') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
  }
  next();
});

// Middleware bezpieczeństwa
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
app.use(xss()); // Sanityzuje dane wejściowe

// Zabezpiecz wszystkie trasy przez Supabase Auth
app.use(supabaseAuth);

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

// Połączenie z bazą danych MongoDB
connectDB();

// Konfiguracja portu i uruchomienie serwera
const PORT = process.env.PORT || 3000;

module.exports = app; 