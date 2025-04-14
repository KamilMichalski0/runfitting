const dotenv = require('dotenv');
const path = require('path');

// Jawnie wskazuję ścieżkę do pliku .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Ścieżka do .env:', path.resolve(process.cwd(), '.env'));
console.log('Test zmiennych środowiskowych:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI istnieje:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'undefined'); 