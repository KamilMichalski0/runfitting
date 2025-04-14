const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('Test połączenia z MongoDB');

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

// Sprawdzenie czy MONGODB_URI zostało wczytane
console.log('MONGODB_URI załadowany:', !!process.env.MONGODB_URI);

// Próbujemy połączyć się z bazą danych
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Sukces! Połączono z bazą danych MongoDB');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Błąd połączenia z bazą danych:');
    console.error('Treść błędu:', err.message);
  }); 