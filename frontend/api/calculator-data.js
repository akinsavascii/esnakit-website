import axios from 'axios';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  // CORS başlıklarını ayarla
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Platformu query parametresinden al
    const platform = req.query.platform || 'trendyol';
    
    // Tüm platformlar için ortak veri
    const platforms = [
      { id: 'trendyol', name: 'Trendyol', description: 'Türkiye\'nin önde gelen e-ticaret platformu' },
      { id: 'hepsiburada', name: 'Hepsiburada', description: 'Türkiye\'nin önde gelen online alışveriş sitesi' },
      { id: 'n11', name: 'n11', description: 'Alışverişin uğurlu adresi' },
      { id: 'amazon', name: 'Amazon TR', description: 'Amazon\'un Türkiye platformu' }
    ];

    // Varsayılan veriler ve kargo ücretleri
    const cargoCompanies = {
      aras: {
        name: 'Aras Kargo',
        cargoRates: {
          1: 17.90, 2: 19.90, 3: 22.90, 4: 25.90, 5: 29.90, 6: 32.90,
          7: 35.90, 8: 37.90, 9: 39.90, 10: 41.90, 11: 44.90, 12: 47.90,
        },
        discountRate: 0.25
      },
      yurtici: {
        name: 'Yurtiçi Kargo',
        cargoRates: {
          1: 18.90, 2: 20.90, 3: 23.90, 4: 26.90, 5: 30.90, 6: 33.90,
          7: 36.90, 8: 38.90, 9: 40.90, 10: 42.90, 11: 45.90, 12: 48.90,
        },
        discountRate: 0.25
      },
      ptt: {
        name: 'PTT Kargo',
        cargoRates: {
          1: 16.90, 2: 18.90, 3: 21.90, 4: 24.90, 5: 28.90, 6: 31.90,
          7: 34.90, 8: 36.90, 9: 38.90, 10: 40.90, 11: 43.90, 12: 46.90,
        },
        discountRate: 0.20
      },
      mng: {
        name: 'MNG Kargo',
        cargoRates: {
          1: 18.50, 2: 20.50, 3: 23.50, 4: 26.50, 5: 30.50, 6: 33.50,
          7: 36.50, 8: 38.50, 9: 40.50, 10: 42.50, 11: 45.50, 12: 48.50,
        },
        discountRate: 0.25
      }
    };

    // Platforma özgü veri
    let categories = [];
    let paymentFeeRate = 0.015;
    let vatRate = 0.18;
    
    // Vercel'de web scraping yapmak yerine varsayılan sabit verileri kullanıyoruz
    // Not: Gerçek bir uygulamada düzenli scraping yapıp veritabanında saklayabilirsiniz
    switch (platform) {
      case 'trendyol':
        categories = [
          { name: 'Elektronik', rate: 0.12 },
          { name: 'Giyim & Aksesuar', rate: 0.15 },
          { name: 'Ev & Yaşam', rate: 0.13 },
          { name: 'Anne & Bebek', rate: 0.14 },
          { name: 'Kozmetik & Kişisel Bakım', rate: 0.16 },
          { name: 'Spor & Outdoor', rate: 0.15 },
          { name: 'Kitap & Hobi', rate: 0.12 },
          { name: 'Süpermarket & Pet Shop', rate: 0.11 },
          { name: 'Ayakkabı & Çanta', rate: 0.15 },
          { name: 'Mücevher & Saat', rate: 0.17 },
          { name: 'Otomotiv & Motosiklet', rate: 0.12 }
        ];
        paymentFeeRate = 0.015;
        break;
        
      case 'hepsiburada':
        categories = [
          { name: 'Elektronik', rate: 0.13 },
          { name: 'Giyim', rate: 0.16 },
          { name: 'Ev & Yaşam', rate: 0.14 },
          { name: 'Kozmetik', rate: 0.17 },
          { name: 'Kitap & Kırtasiye', rate: 0.11 },
          { name: 'Oyuncak', rate: 0.15 },
          { name: 'Spor', rate: 0.14 },
          { name: 'Otomotiv', rate: 0.12 }
        ];
        paymentFeeRate = 0.016;
        break;
        
      case 'n11':
        categories = [
          { name: 'Elektronik', rate: 0.11 },
          { name: 'Moda', rate: 0.14 },
          { name: 'Ev & Yaşam', rate: 0.12 },
          { name: 'Anne & Bebek', rate: 0.13 },
          { name: 'Kozmetik & Kişisel Bakım', rate: 0.15 },
          { name: 'Kitap & Film & Müzik', rate: 0.10 },
          { name: 'Spor & Outdoor', rate: 0.13 },
          { name: 'Otomotiv & Motosiklet', rate: 0.11 }
        ];
        paymentFeeRate = 0.014;
        break;
        
      case 'amazon':
        categories = [
          { name: 'Elektronik', rate: 0.09 },
          { name: 'Kitaplar', rate: 0.15 },
          { name: 'Mutfak', rate: 0.12 },
          { name: 'Spor', rate: 0.12 },
          { name: 'Oyuncak', rate: 0.10 },
          { name: 'Bahçe', rate: 0.11 },
          { name: 'Giyim & Aksesuar', rate: 0.13 },
          { name: 'Güzellik & Kişisel Bakım', rate: 0.12 }
        ];
        paymentFeeRate = 0.017;
        break;
        
      default:
        categories = [
          { name: 'Elektronik', rate: 0.12 },
          { name: 'Giyim & Aksesuar', rate: 0.15 },
          { name: 'Ev & Yaşam', rate: 0.13 }
        ];
        paymentFeeRate = 0.015;
    }
    
    // Tüm verileri birleştir
    const calculatorData = {
      platforms,
      categories,
      cargoCompanies,
      paymentFeeRate,
      vatRate
    };
    
    res.status(200).json(calculatorData);
  } catch (error) {
    console.error('API hatası:', error);
    res.status(500).json({ error: 'Veriler alınamadı. Lütfen daha sonra tekrar deneyin.' });
  }
} 