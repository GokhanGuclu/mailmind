# Mail Kategori Sınıflandırma Projesi

Bu proje, Gemini AI kullanarak oluşturulan e-posta verilerini kategorilere ayırmak için makine öğrenmesi modeli geliştirir.

## Proje Yapısı

- **mail_generator.py**: Gemini API ile e-posta verisi üretir
- **mail_classifier.py**: Scikit-learn ile temel kategori tahmin modeli eğitir
- **mail_classifier_advanced.py**: ⭐ **YENİ!** Gelişmiş ML teknikleri ile kategori tahmin modeli (modüler yapı)
- **mail_classifier_model/**: ⭐ **YENİ!** Modüler mail sınıflandırma paketi
  - `config.py`: Konfigürasyon ve sabitler
  - `preprocessing.py`: MetinTemizleyici ve MetrikCikarici sınıfları
  - `data_loader.py`: Veri yükleme fonksiyonları
  - `model_trainer.py`: Model eğitimi ve karşılaştırma
  - `model_manager.py`: Model kaydetme/yükleme
  - `predictor.py`: Tahmin fonksiyonları
  - `__init__.py`: Paket dışa aktarmaları
- **mail_classifier_bert.py**: BERT ile kategori tahmin modeli eğitir
- **reorganize_categories.py**: ⭐ Kategori yeniden düzenleme aracı
- **test_model.py**: Temel model için test scripti
- **test_model_advanced.py**: ⭐ Gelişmiş model için test scripti (100 test örneği - 10 kategori x 10)
- **test_interactive_advanced.py**: ⭐ İnteraktif manuel test aracı
- **mailler.csv**: Üretilen e-posta verileri
- **requirements.txt**: Python bağımlılıkları
- **.env**: Environment variables (API key) - Git'e eklenmez
- **env.example**: Environment variables örneği
- **.gitignore**: Git ignore kuralları

## Kurulum

1. Sanal ortam oluşturun:
```bash
python -m venv .venv
```

2. Sanal ortamı aktive edin:
```bash
# Windows Git Bash
source .venv/Scripts/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

3. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

4. Environment variables ayarlayın:
```bash
# Windows PowerShell
copy env.example .env

# Windows Command Prompt
copy env.example .env

# Linux/Mac
cp env.example .env
```

5. `.env` dosyasını açın ve Gemini API key'inizi ekleyin:
```
GEMINI_API_KEY=your_actual_api_key_here
```

**API Key Nasıl Alınır?**
- Google AI Studio'ya gidin: https://makersuite.google.com/app/apikey
- Yeni bir API key oluşturun
- API key'i kopyalayıp `.env` dosyasına yapıştırın

## Kullanım

### 1. E-posta Verisi Üretimi

`.env` dosyasında API key'inizi ayarladıktan sonra:

```bash
python mail_generator.py
```

Bu komut:
- 10 farklı kategoride e-posta üretir
- **Kategori-özel prompt mühendisliği** ile yüksek kaliteli, tutarlı e-postalar üretir
- Her kategori için detaylı içerik kuralları ve örnekler içerir
- Her kategori için hedef sayıda e-posta oluşturur
- Günlük istek limitini (RPD) takip eder
- Verileri `mailler.csv` dosyasına kaydeder

**Özellikler:**
- ✅ Her kategori için özel açıklamalar ve kurallar
- ✅ Gerçekçi ve makine öğrenmesi dostu e-postalar
- ✅ Kategori karışıklığını minimize eden prompt tasarımı
- ✅ Tutarlı ve öngörülebilir veri kalitesi

### 1.5. Kategori Yeniden Düzenleme (İsteğe Bağlı)

Eğer kategorileri birleştirmek veya yeniden düzenlemek istiyorsanız:

```bash
python reorganize_categories.py
```

Bu komut:
- ✅ Mevcut veriyi yedekler
- ✅ Kategorileri yeniden düzenler (birleştirme/yeniden adlandırma)
- ✅ Eski model dosyalarını otomatik temizler
- ✅ `mailler.csv` dosyasını günceller
- ⚠️  Yeniden düzenleme sonrası modeli tekrar eğitmeniz gerekir

### 2. Model Eğitimi

#### 🎯 Gelişmiş ML Yaklaşımı (ÖNERİLEN)

E-posta kategorilerini tahmin etmek için gelişmiş modeli eğitin:

```bash
python mail_classifier_advanced.py
```

Bu komut:
- ⭐ **5 farklı modeli karşılaştırır** (Naive Bayes, Logistic Regression, Random Forest, SVM, XGBoost)
- ⚡ **Performans ve hız dengesi** (3-5 dakika içinde eğitilir)
- 🔧 **Gelişmiş özellik çıkarımı** (TF-IDF + metrikler)
- 📊 **Detaylı metrik raporları** (Accuracy, F1, Precision, Recall)
- 🗺️ **Normalize confusion matrix** görselleştirmesi
- 📈 **En çok karıştırılan kategoriler** analizi
- 🎯 **En önemli özellikler** (kelimeler) listesi
- 💾 **JSON metrik kaydı** ve **CSV özellik önemleri**

#### Temel ML Yaklaşımı (Scikit-learn)

Daha basit ve hızlı model için:

```bash
python mail_classifier.py
```

Bu komut:
- 3 farklı modeli karşılaştırır (Naive Bayes, Random Forest, SVM)
- En iyi modeli seçer ve kaydeder
- Confusion matrix görselleştirmesi oluşturur
- Test örnekleriyle tahmin yapar

#### BERT Yaklaşımı

Derin öğrenme tabanlı BERT modeli ile eğitim:

```bash
python mail_classifier_bert.py
```

Bu komut:
- BERTurk veya Multilingual BERT kullanır
- Transfer learning ile fine-tuning yapar
- Daha yüksek doğruluk oranı elde eder
- `confusion_matrix_bert.png` oluşturur

**Not**: BERT eğitimi daha uzun sürer ve daha fazla RAM/bellek gerektirir.

### 3. Model Kullanımı

#### İnteraktif Tahmin Araçları

Eğitilmiş modellerle interaktif tahmin yapmak için:

```bash
# ⭐ İnteraktif manuel giriş (ÖNERİLEN - Kendi maillerinizi test edin)
python test_interactive_advanced.py

# ⭐ Otomatik test senaryoları (100 test örneği - 10 kategori x 10)
python test_model_advanced.py

# Temel Scikit-learn modeli için
python test_model.py

# BERT modeli için
python test_model_bert.py
```

**İnteraktif araç (`test_interactive_advanced.py`):**
- Kendi mail başlığı ve içeriğinizi manuel olarak girebilirsiniz
- Tüm kategoriler için detaylı olasılık dağılımı gösterir
- Güven skorları ve görsel grafikler içerir
- Sürekli test yapabilir, 'çıkış' ile çıkabilirsiniz

**Otomatik test (`test_model_advanced.py`):**
- 100 hazır test senaryosu (10 kategori x 10 örnek)
- Doğruluk oranı ve genel performans gösterir
- Model karşılaştırması için idealdir

#### Programatik Kullanım

Kod içinde kullanmak için:

```python
from mail_classifier import tahmin_yap

baslik = "Toplantı Bugün"
icerik = "Yarınki proje toplantısı saat 14:00'te yapılacak."

tahmin, olasiliklar = tahmin_yap(baslik, icerik)
print(f"Tahmin edilen kategori: {tahmin}")
```

## Model Özellikleri

### Gelişmiş Model (mail_classifier_advanced.py)
- ⭐ **Gelişmiş Özellik Çıkarımı**: TF-IDF + metrikler (kelime sayısı, karakter sayısı, cümle sayısı, vb.)
- 🧹 **Akıllı Veri Temizleme**: URL, e-posta, sayı temizleme, Türkçe stopwords
- 🤖 **5 Model Karşılaştırması**: Naive Bayes, Logistic Regression, Random Forest, SVM, XGBoost
- 📊 **Veri Dengeleme**: SMOTE ile oversampling
- 📈 **Gelişmiş N-grams**: (1,3) range ile trigram desteği
- 🎯 **Detaylı Metrikler**: Accuracy, F1-Macro, Precision-Macro, Recall-Macro
- 📉 **Normalize Confusion Matrix**: Yüzdelik oranlarla görselleştirme
- 🔍 **Özellik Önem Analizi**: En anlamlı kelimeler/özellikler
- 📝 **Kapsamlı Raporlama**: JSON metrikler, CSV özellik önemleri

### Temel Model (mail_classifier.py)
- **TF-IDF Vektörizasyon**: Unigram ve bigram özellikler
- **Model Seçimi**: 3 farklı algoritma karşılaştırması
- **Cross-Validation**: 5-fold cross validation ile doğrulama
- **Detaylı Raporlama**: Confusion matrix ve classification report

## Kategoriler

Kategoriler daha anlamlı ve yönetilebilir olacak şekilde optimize edilmiştir:

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

**Not**: Eğer veri setinizde eski kategori adları varsa, `python reorganize_categories.py` komutunu çalıştırarak otomatik olarak yeni kategorilere dönüştürebilirsiniz.

## Notlar

- Günlük API limiti (RPD) varsayılan olarak 1500 olarak ayarlanmıştır
- Temel model dosyaları: `mail_model.pkl` ve `mail_vectorizer.pkl`
- **Gelişmiş model dosyaları**: `model/` klasöründe kaydedilir:
  - `model/mail_model_advanced.pkl`
  - `model/mail_vectorizer_advanced.pkl`
  - `model/scaler_advanced.pkl`
  - `model/temizleyici_advanced.pkl`
  - `model/metrik_cikarici_advanced.pkl`
  - `model/label_to_id_advanced.npy`
  - `model/id_to_label_advanced.npy`
  - `model/metrikler_advanced.json`
  - `model/ozellik_onemleri.csv`
- BERT model dosyaları: `bert_model/` klasöründe kaydedilir
- Confusion matrix: `confusion_matrix.png` (temel), `confusion_matrix_advanced.png` (gelişmiş), ve `confusion_matrix_bert.png` (BERT)

## Model Karşılaştırması

Bu proje, hem geleneksel makine öğrenmesi hem de derin öğrenme yaklaşımlarını içerir:

- **Temel Scikit-learn**: Hızlı eğitim, daha az kaynak gerektirir
- **⭐ Gelişmiş Scikit-learn**: En yüksek denge (doğruluk + hız + özellikler)
- **BERT**: Daha yüksek doğruluk, bağlamsal anlama yeteneği
- Her model aynı veri seti ile eğitilir ve karşılaştırılabilir

### Hangi Modeli Seçmeliyim?

- **Gelişmiş Model**: Genel kullanım için **EN ÖNERİLEN** - iyi performans, dengeli özellikler
- **Temel Model**: Hızlı prototip veya çok basit kullanım durumları için
- **BERT Model**: Maksimum doğruluk isteniyorsa ve kaynak varsa

## Gelişmiş Model Özellikleri Detayları

### Veri Temizleme
✅ Türkçe stopwords listesi ile gereksiz kelimeler kaldırılır  
✅ URL, e-posta adresi ve sayılar temizlenir  
✅ Özel karakterler normalize edilir  
✅ Minimum kelime/karakter sayısı kontrolü ile anlamsız metinler filtrelenir  

### Özellik Mühendisliği
✅ **TF-IDF Vektörizasyon**: 12,000 özellik, (1,3) ngram range, sublinear_tf (performans için optimize)  
✅ **Metrik Özellikleri**: Kelime sayısı, karakter sayısı, cümle sayısı, büyük harf sayısı, ünlem/soru işareti sayısı, ortalama kelime uzunluğu  
✅ **Birleşik Özellik Seti**: TF-IDF + metrikler kombine edilir  

### Model Algoritmaları
✅ **Naive Bayes**: Hızlı baseline model (sadece TF-IDF kullanır - negatif değer alamaz)  
✅ **Logistic Regression**: Genellikle TF-IDF işlerinde en başarılı (hız için optimize)  
✅ **Random Forest**: Ensemble yöntemi, 50 ağaç, max_depth=30  
✅ **Linear SVM**: Lineer SVC, hızlı ve etkili  
✅ **XGBoost**: Gradient boosting, 50 tree, max_depth=5  

### Veri Dengeleme ve Hız Optimizasyonu
✅ **Class Weights**: Model seviyesinde dengesizlik düzeltmesi  
✅ **SMOTE kaldırıldı**: Hız için SMOTE yerine class_weight kullanılıyor  
✅ **Performans/hız dengesi**: 12,000 özellik, (1,3) ngram  
✅ **Ağaç sayıları optimize**: Random Forest 50, XGBoost 50  
✅ **Eğitim süresi**: ~3-5 dakika (5 model karşılaştırması ile)  

### Değerlendirme ve Raporlama
✅ Normalize confusion matrix (yüzdelik)  
✅ Accuracy, F1-Macro, Precision-Macro, Recall-Macro metrikleri  
✅ En çok karıştırılan kategoriler analizi  
✅ Feature importance ile en anlamlı kelimeler  
✅ JSON formatında metrik kaydı  
✅ CSV formatında özellik önemleri  

