const app = require('./app');
const dotenv = require('dotenv');

// Konfiguracja zmiennych środowiskowych
dotenv.config();

// Obsługa nieobsłużonych wyjątków
process.on('uncaughtException', err => {
  console.error('NIEOBSŁUŻONY WYJĄTEK! 💥 Zamykanie serwera...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Ustawienie portu serwera
const port = process.env.PORT || 3000;

// Uruchomienie serwera
const server = app.listen(port, () => {
  console.log(`Serwer uruchomiony na porcie ${port}`);
  console.log(`Dokumentacja API dostępna pod adresem: http://localhost:${port}/api-docs`);
});

// Obsługa nieobsłużonych odrzuceń (rejection)
process.on('unhandledRejection', err => {
  console.error('NIEOBSŁUŻONE ODRZUCENIE! 💥 Zamykanie serwera...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
}); 