const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Sprawdzenie czy plik .env istnieje
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`Znaleziono plik .env w: ${envPath}`);
  // Jawnie wczytujemy plik .env
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.error('Błąd podczas wczytywania pliku .env:', result.error.message);
  } else {
    console.log('Zmienne środowiskowe zostały wczytane pomyślnie');
    // Wypisujemy nazwy wczytanych zmiennych (bez ich wartości)
    console.log('Wczytane zmienne środowiskowe:', Object.keys(result.parsed).join(', '));
  }
} else {
  console.error(`Nie znaleziono pliku .env w: ${envPath}`);
}

// Importujemy resztę aplikacji dopiero po wczytaniu zmiennych środowiskowych
const app = require('./app');

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