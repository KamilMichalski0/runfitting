require('dotenv').config();
const { connectDB } = require('./src/config/database');

async function testConnection() {
  try {
    await connectDB();
    console.log('Test połączenia z MongoDB zakończony sukcesem!');
    process.exit(0);
  } catch (error) {
    console.error('Błąd podczas testu połączenia z MongoDB:');
    console.error(error);
    process.exit(1);
  }
}

testConnection(); 