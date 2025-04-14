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
    console.log('Wczytane zmienne:', Object.keys(result.parsed).join(', '));
  }
} else {
  console.error(`Nie znaleziono pliku .env w: ${envPath}`);
}

// Wyświetlenie konkretnych zmiennych
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'URI załadowane' : 'URI nie załadowane');
console.log('TEST_MODE:', process.env.TEST_MODE); 