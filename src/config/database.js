const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Konfiguracja połączenia z MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Błąd połączenia z bazą danych:', error.message);
    process.exit(1);
  }
};

module.exports = {
  connectDB
}; 