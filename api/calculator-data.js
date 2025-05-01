// Calculator Data API - Vercel Serverless Function
const express = require('express');
const cors = require('cors');
const apiFunction = require('../backend/routes/api');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://esnakit.com', 'https://www.esnakit.com', 'https://esnakit-website.vercel.app']
}));
app.use(express.json());

// Tüm istekleri backend API router'ına yönlendir
app.use(apiFunction);

// Export for Vercel
module.exports = app; 