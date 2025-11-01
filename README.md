# MailMind - Mail Kategori Sınıflandırma Projesi

MailMind, Gemini AI kullanarak oluşturulan e-posta verilerini akıllı şekilde kategorilere ayıran gelişmiş bir makine öğrenmesi sistemidir.

## Proje Yapısı

### Ana Dosyalar
- **mail_generator.py**: Gemini API ile e-posta verisi üretir
- **mail_classifier_advanced.py**: Gelişmiş ML model eğitim scripti
- **mail_classifier_model/**: Modüler mail sınıflandırma paketi
  - `__init__.py`: Paket dışa aktarmaları
  - `config.py`: Konfigürasyon ve sabitler
  - `preprocessing.py`: MetinTemizleyici ve MetrikCikarici sınıfları
  - `data_loader.py`: Veri yükleme fonksiyonları
  - `model_trainer.py`: Model eğitimi ve karşılaştırma
  - `model_manager.py`: Model kaydetme/yükleme
  - `predictor.py`: Tahmin fonksiyonları
- **testler/**: Test scriptleri
  - `test_model_advanced.py`: 100 test senaryosu (10 kategori x 10)
  - `test_interactive_advanced.py`: İnteraktif manuel test aracı
- **mailler.csv**: Eğitim verileri
- **model/**: Eğitilmiş modeller
- **.env**: Environment variables (API key) - Git'e eklenmez
- **.gitignore**: Git ignore kuralları
- **requirements.txt**: Python bağımlılıkları

## Kurulum

### 1. Sanal Ortam Oluşturun
```bash
python -m venv .venv
```

### 2. Sanal Ortamı Aktive Edin
```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# Windows Git Bash
source .venv/Scripts/activate

# Linux/Mac
source .venv/bin/activate
```

### 3. Bağımlılıkları Yükleyin
```bash
pip install -r requirements.txt
```

### 4. Environment Variables Ayarlayın
```bash
# Windows PowerShell/CMD
echo GEMINI_API_KEY=your_api_key_here > .env

# Linux/Mac
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

**Gemini API Key Nasıl Alınır?**
1. Google AI Studio'ya gidin: https://makersuite.google.com/app/apikey
2. Yeni bir API key oluşturun
3. API key'i `.env` dosyasına ekleyin

## Kullanım

### 1. Veri Üretimi (İsteğe Bağlı)

Eğitim verileri zaten `mailler.csv` dosyasında mevcuttur. Yeni veri üretmek isterseniz:

```bash
python mail_generator.py
```

**Özellikler:**
- ✅ 10 farklı kategori (İş/Acil, Pazarlama, Eğitim, vb.)
- ✅ Kategori-özel prompt mühendisliği
- ✅ Gerçekçi ve tutarlı e-posta üretimi
- ✅ Günlük istek limiti (RPD) kontrolü

### 2. Model Eğitimi

```bash
python mail_classifier_advanced.py
```

**Çıktı:**
- ⭐ 5 farklı model karşılaştırması (Naive Bayes, Logistic Regression, Random Forest, SVM, XGBoost)
- ⚡ Hız: 3-5 dakika
- 📊 Detaylı metrik raporları
- 🗺️ Normalize confusion matrix
- 📈 En önemli özellikler analizi
- 💾 Model dosyaları `model/` klasörüne kaydedilir

### 3. Model Test

#### İnteraktif Test
```bash
python testler/test_interactive_advanced.py
```

Kendi mail başlığı ve içeriğinizi girebilir, tahminleri görüntüleyebilirsiniz.

#### Otomatik Test
```bash
python testler/test_model_advanced.py
```

100 hazır test senaryosu ile modelinizi değerlendirin.

#### Programatik Kullanım
```python
from mail_classifier_model import tahmin_yap

baslik = "Toplantı Daveti"
icerik = "Yarın saat 14:00'te proje toplantısı yapılacaktır."

tahmin, olasiliklar = tahmin_yap(baslik, icerik)
print(f"Tahmin: {tahmin}")
print(f"Güven: {olasiliklar[tahmin]:.2%}")
```

## Kategoriler

MailMind 10 farklı kategori tanır:

- **İş/Acil**: İş e-postaları ve acil durum bildirimleri
- **Güvenlik/Uyarı**: Güvenlik uyarıları ve bildirimler
- **Pazarlama**: Reklam ve alışveriş e-postaları
- **Sosyal Medya**: Sosyal medya bildirimleri
- **Spam**: İstenmeyen e-postalar
- **Abonelik/Fatura**: Üyelik, abonelik ve fatura e-postaları
- **Kişisel**: Kişisel iletişim ve mesajlar
- **Eğitim/Öğretim**: Eğitim ve öğretim içerikli e-postalar
- **Sağlık**: Sağlık ile ilgili e-postalar
- **Diğer**: Diğer tüm kategoriler

## Model Özellikleri

### Gelişmiş Özellik Çıkarımı
- **TF-IDF Vektörizasyon**: 12,000 özellik, (1,3) ngram range
- **Metrik Özellikleri**: Kelime sayısı, karakter sayısı, cümle sayısı, büyük harf, noktalama, ortalama kelime uzunluğu
- **Birleşik Özellik Seti**: TF-IDF + metrikler

### Akıllı Veri Temizleme
- URL, e-posta, sayı temizleme
- Türkçe stopwords filtresi
- Özel karakter normalizasyonu
- Minimum metin uzunluğu kontrolü

### Model Algoritmaları
- **Naive Bayes**: Hızlı baseline
- **Logistic Regression**: Dengeli performans
- **Random Forest**: Ensemble (50 ağaç)
- **Linear SVM**: Hızlı ve etkili
- **XGBoost**: Gradient boosting

### Performans
- **Eğitim Süresi**: 3-5 dakika
- **Class Weights**: Veri dengesizliği yönetimi
- **Optimize Hiperparametreler**: Hız ve performans dengesi

### Değerlendirme
- Accuracy, F1-Macro, Precision-Macro, Recall-Macro
- Normalize confusion matrix
- En çok karıştırılan kategoriler analizi
- Feature importance

## Model Dosyaları

Model eğitim sonrası `model/` klasörüne kaydedilir:

- `mail_model_advanced.pkl` - Eğitilmiş model
- `mail_vectorizer_advanced.pkl` - TF-IDF vektörizer
- `scaler_advanced.pkl` - Standart normalizasyon
- `temizleyici_advanced.pkl` - Metin temizleyici
- `metrik_cikarici_advanced.pkl` - Metrik çıkarıcı
- `label_to_id_advanced.npy` - Label eşleştirmesi
- `id_to_label_advanced.npy` - Ters eşleştirme
- `metrikler_advanced.json` - Performans metrikleri
- `ozellik_onemleri.csv` - En önemli özellikler
- `confusion_matrix_advanced.png` - Karışıklık matrisi

## Güvenlik

- ✅ API key `.env` dosyasında saklanır
- ✅ `.env` dosyası `.gitignore` listesinde
- ✅ Özel bilgileriniz Git'e yüklenmez

## Gereksinimler

- Python 3.8+
- google-generativeai
- scikit-learn
- pandas, numpy
- matplotlib, seaborn
- xgboost
- python-dotenv

Tüm bağımlılıklar `requirements.txt` dosyasında listelenmiştir.

## Lisans

Bu proje eğitim amaçlı geliştirilmiştir.
