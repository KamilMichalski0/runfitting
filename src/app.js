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
// const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const planRoutes = require('./routes/plan.routes');
// const exerciseRoutes = require('./routes/exercise.routes');

// Importowanie middleware obsługi błędów
const globalErrorHandler = require('./middleware/error.middleware');
const AppError = require('./utils/app-error');

// Konfiguracja środowiska
dotenv.config();

// Inicjalizacja aplikacji Express
const app = express();

// Middleware bezpieczeństwa
app.use(helmet()); // Ustawia nagłówki bezpieczeństwa
app.use(cors()); // Umożliwia CORS
app.use(xss()); // Sanityzuje dane wejściowe

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
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Routing
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/plans', planRoutes);
// app.use('/api/exercises', exerciseRoutes);

// Testowy endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API RunFitting działa prawidłowo!'
  });
});

// Montowanie routerów
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);

// Obsługa błędnych ścieżek
app.all('*', (req, res, next) => {
  next(new AppError(`Nie można znaleźć ${req.originalUrl} na tym serwerze!`, 404));
});

// Middleware obsługi błędów
app.use(globalErrorHandler);

// Połączenie z bazą danych MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Połączono z bazą danych MongoDB'))
  .catch(err => console.error('Błąd połączenia z bazą danych:', err));

// Konfiguracja portu i uruchomienie serwera
const PORT = process.env.PORT || 3000;

module.exports = app; 