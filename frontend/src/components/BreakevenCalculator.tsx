import React, { useState, useRef, useEffect } from 'react';
import './BreakevenCalculator.css';

interface FormValues {
  platform: string;
  productCost: number;
  category: string;
  desi: number;
  cargoCompany: string;
  hasCargoDiscount: boolean;
  includesVAT: boolean;
  // Desi calculator fields
  productLength: number;
  productWidth: number;
  productHeight: number;
  showDesiCalculator: boolean;
  // Advanced options
  showAdvancedOptions: boolean;
}

interface CategoryCommission {
  name: string;
  rate: number;
}

interface CargoCompany {
  name: string;
  cargoRates: {
    [key: number]: number;
  };
  discountRate: number;
}

interface Platform {
  id: string;
  name: string;
  description: string;
}

interface CalculatorData {
  platforms: Platform[];
  categories: CategoryCommission[];
  cargoCompanies: { [key: string]: CargoCompany };
  paymentFeeRate: number;
  vatRate: number;
}

const BreakevenCalculator: React.FC = () => {
  const [values, setValues] = useState<FormValues>({
    platform: 'trendyol',
    productCost: 0,
    category: 'Elektronik',
    desi: 1,
    cargoCompany: 'aras',
    hasCargoDiscount: false,
    includesVAT: true,
    productLength: 0,
    productWidth: 0,
    productHeight: 0,
    showDesiCalculator: false,
    showAdvancedOptions: true
  });
  
  const [result, setResult] = useState<{
    breakEvenPrice: number;
    platformCommission: number;
    cargoFee: number;
    paymentFee: number;
    totalFees: number;
    vatAmount: number;
    withoutFeesPrice: number;
  } | null>(null);

  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    platforms: [],
    categories: [],
    cargoCompanies: {},
    paymentFeeRate: 0.015,
    vatRate: 0.18
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const desiCalculatorRef = useRef<HTMLDivElement>(null);
  const desiInputRef = useRef<HTMLDivElement>(null);

  // API'den verileri çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setResult(null);
        
        // API çağrısını yeniden etkinleştirelim, ancak hata durumu için fallback ekleyelim
        let data: CalculatorData;
        try {
          // Önce API'den verileri çekmeyi dene
          const apiUrl = window.location.hostname === 'localhost' 
            ? `/api/calculator-data?platform=${values.platform}`
            : `/api/calculator-data?platform=${values.platform}`;
          
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            throw new Error('API yanıt vermedi');
          }
          
          data = await response.json();
          console.log('API verisi başarıyla çekildi');
          setError(''); // API çalıştığında hata durumunu temizle
        } catch (apiError) {
          console.error('API hatası:', apiError);
          // API çalışmazsa statik verilere fallback et
          data = getStaticDataForPlatform(values.platform);
          setError('Güncel veriler çekilemedi, son bilinen değerler kullanılıyor.');
        }
        
        setCalculatorData(data);
        
        // İlk kategoriyi varsayılan olarak ayarla
        if (data.categories.length > 0) {
          setValues(prev => ({
            ...prev,
            category: data.categories[0].name
          }));
        }
        
        // İlk kargo şirketini varsayılan olarak ayarla
        const cargoCompanyKeys = Object.keys(data.cargoCompanies);
        if (cargoCompanyKeys.length > 0) {
          setValues(prev => ({
            ...prev,
            cargoCompany: cargoCompanyKeys[0]
          }));
        }
        
      } catch (err) {
        console.error('Veri çekme hatası:', err);
        setError('Veriler yüklenirken bir sorun oluştu. Varsayılan değerler kullanılıyor.');
        
        // Hata durumunda varsayılan verileri kullan
        setCalculatorData({
          platforms: [
            { id: 'trendyol', name: 'Trendyol', description: 'Türkiye\'nin önde gelen e-ticaret platformu' },
            { id: 'hepsiburada', name: 'Hepsiburada', description: 'Türkiye\'nin önde gelen online alışveriş sitesi' },
            { id: 'n11', name: 'n11', description: 'Alışverişin uğurlu adresi' },
            { id: 'amazon', name: 'Amazon', description: 'Dünyanın en büyük e-ticaret platformu' }
          ],
          categories: [
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
          ],
          cargoCompanies: {
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
          },
          paymentFeeRate: 0.015,
          vatRate: 0.18
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [values.platform]); // Platform değiştiğinde verileri tekrar çek

  // Click dışında tıklandığında desi hesaplayıcıyı kapatma
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        desiCalculatorRef.current && 
        !desiCalculatorRef.current.contains(event.target as Node) &&
        desiInputRef.current &&
        !desiInputRef.current.contains(event.target as Node)
      ) {
        setValues(prevValues => ({...prevValues, showDesiCalculator: false}));
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setValues({
      ...values,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const toggleDesiCalculator = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setValues({
      ...values,
      showDesiCalculator: !values.showDesiCalculator
    });
  };

  const calculateDesi = () => {
    const { productLength, productWidth, productHeight } = values;
    if (productLength && productWidth && productHeight) {
      // Eğer çok büyük değerler alınıyorsa, kullanıcı muhtemelen mm olarak giriyor
      // Bu durumda cm'ye çevirmek için 10'a bölüyoruz
      // Bu bir güvenlik mekanizması
      let length = productLength;
      let width = productWidth;
      let height = productHeight;
      
      // Eğer herhangi bir boyut çok büyükse (>100 cm), kullanıcı muhtemelen mm cinsinden giriyor
      const isLikelyMillimeters = productLength > 100 || productWidth > 100 || productHeight > 100;
      
      if (isLikelyMillimeters) {
        length = productLength / 10;
        width = productWidth / 10;
        height = productHeight / 10;
        console.log('Büyük değerler mm olarak kabul edildi ve cm\'ye çevrildi');
      }
      
      // Desi formülü: (En x Boy x Yükseklik) / 3000
      const volumetricWeight = (length * width * height) / 3000;
      
      // Desi değeri en az 1 olmalı ve tam sayıya yuvarlanmalı
      const desi = Math.max(1, Math.ceil(volumetricWeight));
      
      setValues({
        ...values,
        desi: desi,
        showDesiCalculator: false
      });
      
      // Hesaplamayla ilgili bilgi yazdır
      console.log(`Desi hesaplama: ${length} x ${width} x ${height} / 3000 = ${volumetricWeight} (yuvarlanmış: ${desi})`);
    }
  };

  const calculateBreakEvenPrice = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { productCost, category, desi, cargoCompany, hasCargoDiscount, includesVAT } = values;
    
    // Get the commission rate for the selected category
    const selectedCategory = calculatorData.categories.find(cat => cat.name === category) || calculatorData.categories[0];
    const commissionRate = selectedCategory.rate;
    
    // Get the cargo company information
    const selectedCargoCompany = calculatorData.cargoCompanies[cargoCompany];
    
    // Calculate cargo fee
    let desiKey = Math.min(12, Math.max(1, Math.ceil(desi)));
    let cargoFee = selectedCargoCompany.cargoRates[desiKey];
    
    // Apply cargo discount if applicable
    if (hasCargoDiscount) {
      cargoFee = cargoFee * (1 - selectedCargoCompany.discountRate);
    }
    
    // Calculate the minimum price needed to cover costs without fees
    const withoutFeesPrice = productCost;
    
    // Calculate the break-even price including all fees
    // Formula: breakEvenPrice = (productCost + cargoFee) / (1 - commissionRate - paymentFeeRate)
    
    const paymentFeeRate = calculatorData.paymentFeeRate; // Trendyol's payment fee
    const denominator = 1 - commissionRate - paymentFeeRate;
    
    let breakEvenPrice = (productCost + cargoFee) / denominator;
    
    // Calculate VAT if needed
    let vatAmount = 0;
    
    if (includesVAT) {
      // If price should include VAT, adjust the break-even price
      vatAmount = breakEvenPrice * calculatorData.vatRate;
      breakEvenPrice = breakEvenPrice * (1 + calculatorData.vatRate);
    }
    
    // Calculate fees based on the break-even price
    const platformCommission = breakEvenPrice * commissionRate;
    const paymentFee = breakEvenPrice * paymentFeeRate;
    const totalFees = platformCommission + paymentFee + cargoFee;
    
    // Round to 2 decimal places for better UX
    breakEvenPrice = Math.ceil(breakEvenPrice * 100) / 100;
    
    setResult({
      breakEvenPrice,
      platformCommission,
      cargoFee,
      paymentFee,
      totalFees,
      vatAmount,
      withoutFeesPrice
    });

    // Formun en altına otomatik kaydırma
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Platform değişikliğinde sonucu sıfırla
  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResult(null);
    handleChange(e);
  };

  const getCalculatorTitle = () => {
    const platform = calculatorData.platforms.find(p => p.id === values.platform);
    return platform ? `${platform.name} Başabaş Fiyat Hesaplayıcı` : 'E-Ticaret Başabaş Fiyat Hesaplayıcı';
  };

  // Statik veri fonksiyonu
  const getStaticDataForPlatform = (platform: string): CalculatorData => {
    // Tüm platformlar için ortak veri
    const data: CalculatorData = {
      platforms: [
        { id: 'trendyol', name: 'Trendyol', description: 'Türkiye\'nin önde gelen e-ticaret platformu' },
        { id: 'hepsiburada', name: 'Hepsiburada', description: 'Türkiye\'nin önde gelen online alışveriş sitesi' },
        { id: 'n11', name: 'n11', description: 'Alışverişin uğurlu adresi' },
        { id: 'amazon', name: 'Amazon TR', description: 'Amazon\'un Türkiye platformu' }
      ],
      categories: [],
      cargoCompanies: {
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
      },
      paymentFeeRate: 0.015,
      vatRate: 0.18
    };

    // Platforma göre kategori ve ödeme ücreti oranlarını ayarla
    switch (platform) {
      case 'trendyol':
        data.categories = [
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
        data.paymentFeeRate = 0.015;
        break;
      case 'hepsiburada':
        data.categories = [
          { name: 'Elektronik', rate: 0.13 },
          { name: 'Giyim', rate: 0.16 },
          { name: 'Ev & Yaşam', rate: 0.14 },
          { name: 'Kozmetik', rate: 0.17 },
          { name: 'Kitap & Kırtasiye', rate: 0.11 },
          { name: 'Oyuncak', rate: 0.15 },
          { name: 'Spor', rate: 0.14 },
          { name: 'Otomotiv', rate: 0.12 }
        ];
        data.paymentFeeRate = 0.016;
        break;
      case 'n11':
        data.categories = [
          { name: 'Elektronik', rate: 0.11 },
          { name: 'Moda', rate: 0.14 },
          { name: 'Ev & Yaşam', rate: 0.12 },
          { name: 'Anne & Bebek', rate: 0.13 },
          { name: 'Kozmetik & Kişisel Bakım', rate: 0.15 },
          { name: 'Kitap & Film & Müzik', rate: 0.10 },
          { name: 'Spor & Outdoor', rate: 0.13 },
          { name: 'Otomotiv & Motosiklet', rate: 0.11 }
        ];
        data.paymentFeeRate = 0.014;
        break;
      case 'amazon':
        data.categories = [
          { name: 'Elektronik', rate: 0.09 },
          { name: 'Kitaplar', rate: 0.15 },
          { name: 'Mutfak', rate: 0.12 },
          { name: 'Spor', rate: 0.12 },
          { name: 'Oyuncak', rate: 0.10 },
          { name: 'Bahçe', rate: 0.11 },
          { name: 'Giyim & Aksesuar', rate: 0.13 },
          { name: 'Güzellik & Kişisel Bakım', rate: 0.12 }
        ];
        data.paymentFeeRate = 0.017;
        break;
      default:
        data.categories = [
          { name: 'Elektronik', rate: 0.12 },
          { name: 'Giyim & Aksesuar', rate: 0.15 },
          { name: 'Ev & Yaşam', rate: 0.13 }
        ];
    }

    return data;
  };

  if (loading) {
    return (
      <div className="calculator-container">
        <h2>{getCalculatorTitle()}</h2>
        <div className="loading-message">Güncel veriler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="calculator-container">
      <h2>{getCalculatorTitle()}</h2>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      <div className="last-updated">
        <small>Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</small>
      </div>
      
      <form onSubmit={calculateBreakEvenPrice}>
        <div className="form-group">
          <label htmlFor="platform">Platform</label>
          <select
            id="platform"
            name="platform"
            value={values.platform}
            onChange={handlePlatformChange}
          >
            {calculatorData.platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
          {calculatorData.platforms.find(p => p.id === values.platform)?.description && (
            <div className="platform-description">
              {calculatorData.platforms.find(p => p.id === values.platform)?.description}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="productCost">Ürün Maliyet Fiyatı (TL)</label>
          <input
            type="number"
            id="productCost"
            name="productCost"
            value={values.productCost || ''}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="category">Ürün Kategorisi</label>
          <select
            id="category"
            name="category"
            value={values.category}
            onChange={handleChange}
          >
            {calculatorData.categories.map((category, index) => (
              <option key={index} value={category.name}>
                {category.name} ({(category.rate * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group" ref={desiInputRef}>
          <div className="desi-header">
            <label htmlFor="desi">Desi Miktarı</label>
            <button 
              type="button" 
              className="desi-calc-toggle" 
              onClick={toggleDesiCalculator}
            >
              {values.showDesiCalculator ? 'Hesaplayıcıyı Kapat' : 'Desi Hesapla'}
            </button>
          </div>
          <input
            type="number"
            id="desi"
            name="desi"
            value={values.desi || ''}
            onChange={handleChange}
            step="1"
            min="1"
            max="30"
            required
          />
          
          {values.showDesiCalculator && (
            <div className="desi-calculator" ref={desiCalculatorRef}>
              <h4>Desi Hesaplayıcı</h4>
              <p className="desi-info">Desi = (En x Boy x Yükseklik) / 3000</p>
              <p className="desi-info-note">Lütfen tüm ölçüleri santimetre (cm) cinsinden giriniz. Milimetre veya metre kullanmayınız.</p>
              <div className="dimensions-container">
                <div className="dimension-input">
                  <label htmlFor="productLength">En (cm)</label>
                  <input
                    type="number"
                    id="productLength"
                    name="productLength"
                    value={values.productLength || ''}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    placeholder="örn: 30"
                  />
                </div>
                <div className="dimension-input">
                  <label htmlFor="productWidth">Boy (cm)</label>
                  <input
                    type="number"
                    id="productWidth"
                    name="productWidth"
                    value={values.productWidth || ''}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    placeholder="örn: 20"
                  />
                </div>
                <div className="dimension-input">
                  <label htmlFor="productHeight">Yükseklik (cm)</label>
                  <input
                    type="number"
                    id="productHeight"
                    name="productHeight"
                    value={values.productHeight || ''}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    placeholder="örn: 15"
                  />
                </div>
              </div>
              <button 
                type="button" 
                className="calculate-desi-btn" 
                onClick={calculateDesi}
              >
                Desi Hesapla
              </button>
            </div>
          )}
        </div>
        
        {/* Gelişmiş Seçenekler Bölümü - Artık Her Zaman Görünür */}
        <div className="advanced-options-section">
          <h4 className="advanced-options-title">Gelişmiş Seçenekler</h4>
          
          <div className="advanced-options-content">
            <div className="form-group">
              <label htmlFor="cargoCompany">Kargo Firması</label>
              <select
                id="cargoCompany"
                name="cargoCompany"
                value={values.cargoCompany}
                onChange={handleChange}
              >
                {Object.keys(calculatorData.cargoCompanies).map((key) => (
                  <option key={key} value={key}>
                    {calculatorData.cargoCompanies[key].name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="hasCargoDiscount"
                  checked={values.hasCargoDiscount}
                  onChange={handleChange}
                />
                Kargo İndirimi Var
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="includesVAT"
                  checked={values.includesVAT}
                  onChange={handleChange}
                />
                KDV Dahil Fiyat
              </label>
            </div>
          </div>
        </div>
        
        <button type="submit" className="calculate-btn">Başabaş Fiyatı Hesapla</button>
      </form>
      
      {result !== null && (
        <div className="result-container">
          <h3>Hesaplama Sonuçları</h3>
          
          <div className="result-item breakeven">
            <span>Başabaş Noktası Fiyatı:</span>
            <span className="value">{result.breakEvenPrice.toFixed(2)} TL</span>
          </div>
          
          <div className="result-item">
            <span>Ürün Maliyeti:</span>
            <span className="value">{values.productCost.toFixed(2)} TL</span>
          </div>
          
          <div className="result-item">
            <span>Platform Komisyonu ({(calculatorData.categories.find(cat => cat.name === values.category)?.rate || 0) * 100}%):</span>
            <span className="value">{result.platformCommission.toFixed(2)} TL</span>
          </div>
          
          <div className="result-item">
            <span>Ödeme Komisyonu ({calculatorData.paymentFeeRate * 100}%):</span>
            <span className="value">{result.paymentFee.toFixed(2)} TL</span>
          </div>
          
          <div className="result-item">
            <span>Kargo Ücreti ({values.desi} desi):</span>
            <span className="value">{result.cargoFee.toFixed(2)} TL</span>
          </div>
          
          {values.includesVAT && (
            <div className="result-item">
              <span>KDV ({calculatorData.vatRate * 100}%):</span>
              <span className="value">{result.vatAmount.toFixed(2)} TL</span>
            </div>
          )}
          
          <div className="result-item">
            <span>Toplam Giderler:</span>
            <span className="value">{result.totalFees.toFixed(2)} TL</span>
          </div>
          
          <div className="result-item">
            <span>Kalan Kar/Zarar:</span>
            <span className="value">0.00 TL</span>
          </div>
          
          <div className="result-note">
            <p>Not: Başabaş noktası fiyatı, hiç kar veya zarar etmeden satış yapabileceğiniz minimum fiyattır.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakevenCalculator; 