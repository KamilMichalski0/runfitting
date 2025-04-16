const jwt = require('jsonwebtoken');

if (!process.env.SUPABASE_JWT_SECRET) {
  console.error('BŁĄD: Brak zmiennej środowiskowej SUPABASE_JWT_SECRET');
  process.exit(1);
}

module.exports = (req, res, next) => {
  // Pomiń autoryzację dla OPTIONS
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Brak tokena w request headers');
    return res.status(401).json({ error: 'Brak tokena autoryzacyjnego' });
  }

  const token = authHeader.split(' ')[1];
  
  // Debug: pokaż pierwsze 20 znaków tokena
  console.log('Token (pierwsze 20 znaków):', token.substring(0, 20) + '...');

  try {
    // Weryfikacja tokena z użyciem JWT_SECRET
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
      algorithms: ['HS256']
    });

    // Debug: pokaż payload
    console.log('Token zweryfikowany, payload:', decoded);
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Błąd weryfikacji tokena:', {
      name: err.name,
      message: err.message,
      expiredAt: err.expiredAt,
      stack: err.stack
    });

    return res.status(401).json({ 
      error: 'Nieprawidłowy lub wygasły token',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
