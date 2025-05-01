// Vercel serverless fonksiyonu
const express = require('express');
const cors = require('cors');
const apiRoutes = require('../backend/routes/api');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://esnakit.com', 'https://www.esnakit.com', 'https://esnakit-website.vercel.app']
}));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Basic route
app.get('/api', (req, res) => {
  res.json({ message: 'API sunucusu çalışıyor!' });
});

// Catch all route
app.get('*', (req, res) => {
  res.json({ error: 'Geçersiz endpoint' });
});

// Export for Vercel
module.exports = app; 