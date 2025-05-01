const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const axios = require('axios');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: ['http://localhost:3000', 'https://esnakit.com', 'https://www.esnakit.com', 'https://esnakit-website.vercel.app']
})); // Enable CORS with specific origins
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// API Routes
app.use('/api', apiRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Günlük güncelleme için CRON görevi - Vercel'de çalışmayacak, 
// sadece kendi sunucunuzda çalıştırırsanız aktif olacak
if (process.env.NODE_ENV !== 'production') {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log(`[${new Date().toISOString()}] Günlük veri güncelleme görevi başlatıldı`);
      
      // Tüm platformlar için güncel verileri çek
      const platforms = ['trendyol', 'hepsiburada', 'n11', 'amazon'];
      
      for (const platform of platforms) {
        console.log(`${platform} için veriler güncelleniyor...`);
        try {
          // API endpointini çağır - bu backend içindeki çağrı olduğu için localhost kullanılabilir
          await axios.get(`http://localhost:${process.env.PORT || 5001}/api/calculator-data?platform=${platform}`);
          console.log(`${platform} için veriler güncellendi`);
        } catch (err) {
          console.error(`${platform} verilerini güncellerken hata: ${err.message}`);
        }
      }
      
      console.log(`[${new Date().toISOString()}] Günlük veri güncelleme görevi tamamlandı`);
      
      // Güncellenme kaydını tut
      const updateLog = path.join(__dirname, 'data/update-log.txt');
      const logEntry = `[${new Date().toISOString()}] Tüm platformlar için veri güncellendi\n`;
      
      fs.appendFileSync(updateLog, logEntry);
    } catch (error) {
      console.error('CRON görevi hatası:', error);
    }
  });
}

// Veri klasörünü oluştur (yoksa)
try {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (err) {
  console.error('Klasör oluşturma hatası (Vercel\'de beklenen bir durum):', err);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Vercel serverless function için export
if (process.env.NODE_ENV === 'production') {
  // Production ortamında doğrudan export et
  module.exports = app;
} else {
  // Geliştirme ortamında normal sunucu olarak çalıştır
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API bağlantı adresi: http://localhost:${PORT}/api`);
    
    // Sunucu başlatıldığında ilk veri güncellemesini tetikle
    setTimeout(async () => {
      try {
        console.log('İlk veri güncellemesi başlatılıyor...');
        await axios.get(`http://localhost:${PORT}/api/calculator-data?platform=trendyol`);
        console.log('İlk veri güncellemesi tamamlandı');
      } catch (err) {
        console.error('İlk veri güncellemesi sırasında hata:', err.message);
      }
    }, 5000); // Sunucu tam olarak başlatıldıktan sonra çalıştır
  });
} 