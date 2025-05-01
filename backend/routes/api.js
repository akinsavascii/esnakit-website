const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// Ana API test endpoint'i
router.get('/', (req, res) => {
  res.json({ message: 'API çalışıyor!' });
});

// Hesaplayıcı verileri için endpoint
router.get('/calculator-data', async (req, res) => {
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
    
    // Kargo şirketleri bilgisini API'den çek
    const cargoCompanies = await scrapeCargoRates();
    
    // Platforma özgü veri
    let categories = [];
    let paymentFeeRate = 0.015;
    let vatRate = 0.18;
    
    // İlgili platformun verilerini çek
    switch (platform) {
      case 'trendyol':
        // Trendyol için veri çek (web scraping)
        categories = await scrapeTrendyolCommissionRates();
        paymentFeeRate = 0.015;
        break;
        
      case 'hepsiburada':
        // Hepsiburada için veri çek (web scraping)
        categories = await scrapeHepsiburadaCommissionRates();
        paymentFeeRate = 0.016;
        break;
        
      case 'n11':
        // n11 için veri çek (web scraping)
        categories = await scrapeN11CommissionRates();
        paymentFeeRate = 0.014;
        break;
        
      case 'amazon':
        // Amazon TR için veri çek (web scraping)
        categories = await scrapeAmazonCommissionRates();
        paymentFeeRate = 0.017;
        break;
        
      default:
        // Varsayılan olarak Trendyol verilerini kullan
        categories = await scrapeTrendyolCommissionRates();
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
    
    // Güncel verileri logla
    console.log(`[${new Date().toISOString()}] ${platform} için veriler çekildi`);
    console.log(`- ${categories.length} kategori`);
    console.log(`- ${Object.keys(cargoCompanies).length} kargo şirketi`);
    
    res.json(calculatorData);
  } catch (error) {
    console.error('API hatası:', error);
    res.status(500).json({ error: 'Veriler alınamadı. Lütfen daha sonra tekrar deneyin.' });
  }
});

// Platform bazlı scraping fonksiyonları
async function scrapeTrendyolCommissionRates() {
  try {
    console.log('Trendyol komisyon oranları çekiliyor...');
    // Trendyol satıcı başvuru sayfasından veri çekme
    const { data } = await axios.get('https://partner.trendyol.com/komsiyon-oranlari', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const categories = [];
    
    // Komisyon tablosunu bul ve verileri çek
    // Not: Sayfa yapısı değişebilir, bu sadece örnek bir seçici
    $('.commission-table tbody tr').each((index, element) => {
      const categoryName = $(element).find('td:nth-child(1)').text().trim();
      const commissionText = $(element).find('td:nth-child(2)').text().trim();
      
      // Komisyon oranını çıkar (örn: "12%" -> 0.12)
      const commissionRate = parseFloat(commissionText.replace('%', '')) / 100;
      
      if (categoryName && !isNaN(commissionRate)) {
        categories.push({
          name: categoryName,
          rate: commissionRate
        });
      }
    });
    
    console.log(`Trendyol'dan ${categories.length} kategori çekildi`);
    
    // Eğer veri çekilemediyse varsayılan verileri döndür
    if (categories.length === 0) {
      console.log('Veri çekilemedi, varsayılan Trendyol kategorileri kullanılıyor');
      return [
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
    }
    
    return categories;
  } catch (error) {
    console.error('Trendyol scraping hatası:', error.message);
    // Hata durumunda varsayılan değerleri döndür
    return [
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
  }
}

async function scrapeHepsiburadaCommissionRates() {
  try {
    console.log('Hepsiburada komisyon oranları çekiliyor...');
    const { data } = await axios.get('https://www.hepsiburada.com/satici-merkezi', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const categories = [];
    
    // Komisyon tablosunu bul ve verileri çek
    // Not: Sayfa yapısı değişebilir, bu sadece örnek bir seçici
    $('.commission-rates-table tbody tr').each((index, element) => {
      const categoryName = $(element).find('td:nth-child(1)').text().trim();
      const commissionText = $(element).find('td:nth-child(2)').text().trim();
      
      // Komisyon oranını çıkar (örn: "13%" -> 0.13)
      const commissionRate = parseFloat(commissionText.replace('%', '')) / 100;
      
      if (categoryName && !isNaN(commissionRate)) {
        categories.push({
          name: categoryName,
          rate: commissionRate
        });
      }
    });
    
    console.log(`Hepsiburada'dan ${categories.length} kategori çekildi`);
    
    // Eğer veri çekilemediyse varsayılan verileri döndür
    if (categories.length === 0) {
      console.log('Veri çekilemedi, varsayılan Hepsiburada kategorileri kullanılıyor');
      return [
        { name: 'Elektronik', rate: 0.13 },
        { name: 'Giyim', rate: 0.16 },
        { name: 'Ev & Yaşam', rate: 0.14 },
        { name: 'Kozmetik', rate: 0.17 },
        { name: 'Kitap & Kırtasiye', rate: 0.11 },
        { name: 'Oyuncak', rate: 0.15 },
        { name: 'Spor', rate: 0.14 },
        { name: 'Otomotiv', rate: 0.12 }
      ];
    }
    
    return categories;
  } catch (error) {
    console.error('Hepsiburada scraping hatası:', error.message);
    // Hata durumunda varsayılan değerleri döndür
    return [
      { name: 'Elektronik', rate: 0.13 },
      { name: 'Giyim', rate: 0.16 },
      { name: 'Ev & Yaşam', rate: 0.14 },
      { name: 'Kozmetik', rate: 0.17 },
      { name: 'Kitap & Kırtasiye', rate: 0.11 },
      { name: 'Oyuncak', rate: 0.15 },
      { name: 'Spor', rate: 0.14 },
      { name: 'Otomotiv', rate: 0.12 }
    ];
  }
}

async function scrapeN11CommissionRates() {
  try {
    console.log('N11 komisyon oranları çekiliyor...');
    const { data } = await axios.get('https://so.n11.com/komisyon-oranlari', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const categories = [];
    
    // Komisyon tablosunu bul ve verileri çek
    // Not: Sayfa yapısı değişebilir, bu sadece örnek bir seçici
    $('.commission-table tr').each((index, element) => {
      if (index === 0) return; // Başlık satırını atla
      
      const categoryName = $(element).find('td:nth-child(1)').text().trim();
      const commissionText = $(element).find('td:nth-child(2)').text().trim();
      
      // Komisyon oranını çıkar (örn: "11%" -> 0.11)
      const commissionRate = parseFloat(commissionText.replace('%', '')) / 100;
      
      if (categoryName && !isNaN(commissionRate)) {
        categories.push({
          name: categoryName,
          rate: commissionRate
        });
      }
    });
    
    console.log(`N11'den ${categories.length} kategori çekildi`);
    
    // Eğer veri çekilemediyse varsayılan verileri döndür
    if (categories.length === 0) {
      console.log('Veri çekilemedi, varsayılan N11 kategorileri kullanılıyor');
      return [
        { name: 'Elektronik', rate: 0.11 },
        { name: 'Moda', rate: 0.14 },
        { name: 'Ev & Yaşam', rate: 0.12 },
        { name: 'Anne & Bebek', rate: 0.13 },
        { name: 'Kozmetik & Kişisel Bakım', rate: 0.15 },
        { name: 'Kitap & Film & Müzik', rate: 0.10 },
        { name: 'Spor & Outdoor', rate: 0.13 },
        { name: 'Otomotiv & Motosiklet', rate: 0.11 }
      ];
    }
    
    return categories;
  } catch (error) {
    console.error('N11 scraping hatası:', error.message);
    // Hata durumunda varsayılan değerleri döndür
    return [
      { name: 'Elektronik', rate: 0.11 },
      { name: 'Moda', rate: 0.14 },
      { name: 'Ev & Yaşam', rate: 0.12 },
      { name: 'Anne & Bebek', rate: 0.13 },
      { name: 'Kozmetik & Kişisel Bakım', rate: 0.15 },
      { name: 'Kitap & Film & Müzik', rate: 0.10 },
      { name: 'Spor & Outdoor', rate: 0.13 },
      { name: 'Otomotiv & Motosiklet', rate: 0.11 }
    ];
  }
}

async function scrapeAmazonCommissionRates() {
  try {
    console.log('Amazon komisyon oranları çekiliyor...');
    // Amazon'un satıcı sayfasından veri çekmek biraz daha zor olabilir
    // Genellikle giriş yapmayı gerektirebilir, bu yüzden oradan veri çekmek için
    // daha karmaşık bir yaklaşım gerekebilir
    
    const { data } = await axios.get('https://sellercentral.amazon.com.tr/gp/help/external/help.html?itemID=201411300', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const categories = [];
    
    // Amazon'un fee tablosunu bul ve verileri çek
    // Not: Sayfa yapısı değişebilir, bu sadece örnek bir seçici
    $('.fee-table tbody tr').each((index, element) => {
      const categoryName = $(element).find('td:nth-child(1)').text().trim();
      const commissionText = $(element).find('td:nth-child(2)').text().trim();
      
      // Komisyon oranını çıkar (örn: "9%" -> 0.09)
      const commissionRate = parseFloat(commissionText.replace('%', '')) / 100;
      
      if (categoryName && !isNaN(commissionRate)) {
        categories.push({
          name: categoryName,
          rate: commissionRate
        });
      }
    });
    
    console.log(`Amazon'dan ${categories.length} kategori çekildi`);
    
    // Eğer veri çekilemediyse varsayılan verileri döndür
    if (categories.length === 0) {
      console.log('Veri çekilemedi, varsayılan Amazon kategorileri kullanılıyor');
      return [
        { name: 'Elektronik', rate: 0.09 },
        { name: 'Kitaplar', rate: 0.15 },
        { name: 'Mutfak', rate: 0.12 },
        { name: 'Spor', rate: 0.12 },
        { name: 'Oyuncak', rate: 0.10 },
        { name: 'Bahçe', rate: 0.11 },
        { name: 'Giyim & Aksesuar', rate: 0.13 },
        { name: 'Güzellik & Kişisel Bakım', rate: 0.12 }
      ];
    }
    
    return categories;
  } catch (error) {
    console.error('Amazon scraping hatası:', error.message);
    // Hata durumunda varsayılan değerleri döndür
    return [
      { name: 'Elektronik', rate: 0.09 },
      { name: 'Kitaplar', rate: 0.15 },
      { name: 'Mutfak', rate: 0.12 },
      { name: 'Spor', rate: 0.12 },
      { name: 'Oyuncak', rate: 0.10 },
      { name: 'Bahçe', rate: 0.11 },
      { name: 'Giyim & Aksesuar', rate: 0.13 },
      { name: 'Güzellik & Kişisel Bakım', rate: 0.12 }
    ];
  }
}

// Kargo scraping fonksiyonları
async function scrapeCargoRates() {
  try {
    console.log('Kargo ücretleri çekiliyor...');
    
    // Tüm kargo şirketlerinin verilerini paralel olarak çek
    const [arasKargo, yurticiKargo, pttKargo, mngKargo] = await Promise.all([
      scrapeArasKargoRates(),
      scrapeYurticiKargoRates(),
      scrapePttKargoRates(),
      scrapeMngKargoRates()
    ]);
    
    // Kargo verilerini birleştir
    const cargoCompanies = {
      aras: arasKargo,
      yurtici: yurticiKargo,
      ptt: pttKargo,
      mng: mngKargo
    };
    
    return cargoCompanies;
  } catch (error) {
    console.error('Kargo scraping genel hatası:', error.message);
    // Varsayılan kargo verilerini döndür
    return {
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
  }
}

// Aras Kargo ücretlerini çek
async function scrapeArasKargoRates() {
  try {
    console.log('Aras Kargo ücretleri çekiliyor...');
    const { data } = await axios.get('https://www.araskargo.com.tr/bireysel/fiyat-hesapla', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const cargoRates = {};
    
    // Desi tablosunu bul ve ücretleri çek
    // Not: Sayfa yapısı değişebilir, bu sadece örnek bir seçici
    $('.desi-table tbody tr').each((index, element) => {
      const desi = parseInt($(element).find('td:nth-child(1)').text().trim());
      const priceText = $(element).find('td:nth-child(2)').text().trim();
      
      // Fiyatı çıkar (örn: "17,90 TL" -> 17.90)
      const price = parseFloat(priceText.replace('TL', '').replace(',', '.').trim());
      
      if (!isNaN(desi) && !isNaN(price)) {
        cargoRates[desi] = price;
      }
    });
    
    console.log(`Aras Kargo için ${Object.keys(cargoRates).length} desi ücreti çekildi`);
    
    // Eğer veri çekilemediyse varsayılan verileri döndür
    if (Object.keys(cargoRates).length === 0) {
      console.log('Veri çekilemedi, varsayılan Aras Kargo ücretleri kullanılıyor');
      return {
        name: 'Aras Kargo',
        cargoRates: {
          1: 17.90, 2: 19.90, 3: 22.90, 4: 25.90, 5: 29.90, 6: 32.90,
          7: 35.90, 8: 37.90, 9: 39.90, 10: 41.90, 11: 44.90, 12: 47.90,
        },
        discountRate: 0.25
      };
    }
    
    return {
      name: 'Aras Kargo',
      cargoRates: cargoRates,
      discountRate: 0.25 // Varsayılan indirim oranı
    };
  } catch (error) {
    console.error('Aras Kargo scraping hatası:', error.message);
    // Hata durumunda varsayılan değerleri döndür
    return {
      name: 'Aras Kargo',
      cargoRates: {
        1: 17.90, 2: 19.90, 3: 22.90, 4: 25.90, 5: 29.90, 6: 32.90,
        7: 35.90, 8: 37.90, 9: 39.90, 10: 41.90, 11: 44.90, 12: 47.90,
      },
      discountRate: 0.25
    };
  }
}

// Yurtiçi Kargo ücretlerini çek
async function scrapeYurticiKargoRates() {
  try {
    console.log('Yurtiçi Kargo ücretleri çekiliyor...');
    const { data } = await axios.get('https://www.yurticikargo.com/tr/online-servisler/fiyat-hesapla', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const cargoRates = {};
    
    // Desi tablosunu bul ve ücretleri çek
    // Not: Sayfa yapısı değişebilir, bu sadece örnek bir seçici
    $('.price-table tbody tr').each((index, element) => {
      const desi = parseInt($(element).find('td:nth-child(1)').text().trim());
      const priceText = $(element).find('td:nth-child(2)').text().trim();
      
      // Fiyatı çıkar (örn: "18,90 TL" -> 18.90)
      const price = parseFloat(priceText.replace('TL', '').replace(',', '.').trim());
      
      if (!isNaN(desi) && !isNaN(price)) {
        cargoRates[desi] = price;
      }
    });
    
    console.log(`Yurtiçi Kargo için ${Object.keys(cargoRates).length} desi ücreti çekildi`);
    
    // Eğer veri çekilemediyse varsayılan verileri döndür
    if (Object.keys(cargoRates).length === 0) {
      console.log('Veri çekilemedi, varsayılan Yurtiçi Kargo ücretleri kullanılıyor');
      return {
        name: 'Yurtiçi Kargo',
        cargoRates: {
          1: 18.90, 2: 20.90, 3: 23.90, 4: 26.90, 5: 30.90, 6: 33.90,
          7: 36.90, 8: 38.90, 9: 40.90, 10: 42.90, 11: 45.90, 12: 48.90,
        },
        discountRate: 0.25
      };
    }
    
    return {
      name: 'Yurtiçi Kargo',
      cargoRates: cargoRates,
      discountRate: 0.25 // Varsayılan indirim oranı
    };
  } catch (error) {
    console.error('Yurtiçi Kargo scraping hatası:', error.message);
    // Hata durumunda varsayılan değerleri döndür
    return {
      name: 'Yurtiçi Kargo',
      cargoRates: {
        1: 18.90, 2: 20.90, 3: 23.90, 4: 26.90, 5: 30.90, 6: 33.90,
        7: 36.90, 8: 38.90, 9: 40.90, 10: 42.90, 11: 45.90, 12: 48.90,
      },
      discountRate: 0.25
    };
  }
}

// PTT Kargo ücretlerini çek
async function scrapePttKargoRates() {
  try {
    console.log('PTT Kargo ücretleri çekiliyor...');
    const { data } = await axios.get('https://www.ptt.gov.tr/Sayfalar/Ucretler/Ptt-Kargo-Ucretleri.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const cargoRates = {};
    
    // Desi tablosunu bul ve ücretleri çek
    // Not: Sayfa yapısı değişebilir, bu sadece örnek bir seçici
    $('.cargo-rates-table tbody tr').each((index, element) => {
      const desi = parseInt($(element).find('td:nth-child(1)').text().trim());
      const priceText = $(element).find('td:nth-child(2)').text().trim();
      
      // Fiyatı çıkar (örn: "16,90 TL" -> 16.90)
      const price = parseFloat(priceText.replace('TL', '').replace(',', '.').trim());
      
      if (!isNaN(desi) && !isNaN(price)) {
        cargoRates[desi] = price;
      }
    });
    
    console.log(`PTT Kargo için ${Object.keys(cargoRates).length} desi ücreti çekildi`);
    
    // Eğer veri çekilemediyse varsayılan verileri döndür
    if (Object.keys(cargoRates).length === 0) {
      console.log('Veri çekilemedi, varsayılan PTT Kargo ücretleri kullanılıyor');
      return {
        name: 'PTT Kargo',
        cargoRates: {
          1: 16.90, 2: 18.90, 3: 21.90, 4: 24.90, 5: 28.90, 6: 31.90,
          7: 34.90, 8: 36.90, 9: 38.90, 10: 40.90, 11: 43.90, 12: 46.90,
        },
        discountRate: 0.20
      };
    }
    
    return {
      name: 'PTT Kargo',
      cargoRates: cargoRates,
      discountRate: 0.20 // Varsayılan indirim oranı
    };
  } catch (error) {
    console.error('PTT Kargo scraping hatası:', error.message);
    // Hata durumunda varsayılan değerleri döndür
    return {
      name: 'PTT Kargo',
      cargoRates: {
        1: 16.90, 2: 18.90, 3: 21.90, 4: 24.90, 5: 28.90, 6: 31.90,
        7: 34.90, 8: 36.90, 9: 38.90, 10: 40.90, 11: 43.90, 12: 46.90,
      },
      discountRate: 0.20
    };
  }
}

// MNG Kargo ücretlerini çek
async function scrapeMngKargoRates() {
  try {
    console.log('MNG Kargo ücretleri çekiliyor...');
    const { data } = await axios.get('https://www.mngkargo.com.tr/gonderi-ucretleri', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const cargoRates = {};
    
    // Desi tablosunu bul ve ücretleri çek
    // Not: Sayfa yapısı değişebilir, bu sadece örnek bir seçici
    $('.shipping-rates-table tbody tr').each((index, element) => {
      const desi = parseInt($(element).find('td:nth-child(1)').text().trim());
      const priceText = $(element).find('td:nth-child(2)').text().trim();
      
      // Fiyatı çıkar (örn: "18,50 TL" -> 18.50)
      const price = parseFloat(priceText.replace('TL', '').replace(',', '.').trim());
      
      if (!isNaN(desi) && !isNaN(price)) {
        cargoRates[desi] = price;
      }
    });
    
    console.log(`MNG Kargo için ${Object.keys(cargoRates).length} desi ücreti çekildi`);
    
    // Eğer veri çekilemediyse varsayılan verileri döndür
    if (Object.keys(cargoRates).length === 0) {
      console.log('Veri çekilemedi, varsayılan MNG Kargo ücretleri kullanılıyor');
      return {
        name: 'MNG Kargo',
        cargoRates: {
          1: 18.50, 2: 20.50, 3: 23.50, 4: 26.50, 5: 30.50, 6: 33.50,
          7: 36.50, 8: 38.50, 9: 40.50, 10: 42.50, 11: 45.50, 12: 48.50,
        },
        discountRate: 0.25
      };
    }
    
    return {
      name: 'MNG Kargo',
      cargoRates: cargoRates,
      discountRate: 0.25 // Varsayılan indirim oranı
    };
  } catch (error) {
    console.error('MNG Kargo scraping hatası:', error.message);
    // Hata durumunda varsayılan değerleri döndür
    return {
      name: 'MNG Kargo',
      cargoRates: {
        1: 18.50, 2: 20.50, 3: 23.50, 4: 26.50, 5: 30.50, 6: 33.50,
        7: 36.50, 8: 38.50, 9: 40.50, 10: 42.50, 11: 45.50, 12: 48.50,
      },
      discountRate: 0.25
    };
  }
}

module.exports = router; 