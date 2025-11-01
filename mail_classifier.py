import pandas as pd
import numpy as np
import re
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.pipeline import Pipeline
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import warnings
warnings.filterwarnings('ignore')

# Veri dosyası
CSV_DOSYASI = "mailler.csv"
# Model kayıt dosyası
MODEL_DOSYASI = "mail_model.pkl"
VECTORIZER_DOSYASI = "mail_vectorizer.pkl"

def veri_temizle(metin):
    """Metni temizle ve normalize et"""
    if pd.isna(metin):
        return ""
    # Küçük harfe çevir
    metin = str(metin).lower()
    # Tekrar eden boşlukları temizle
    metin = re.sub(r'\s+', ' ', metin)
    # Özel karakterleri temizle (Türkçe karakterler hariç)
    metin = re.sub(r'[^\w\sçğıöşüÇĞIİÖŞÜ]', ' ', metin)
    return metin.strip()


def veri_yukle():
    """CSV dosyasından veriyi yükle ve temizle"""
    print("Veri yükleniyor...")
    df = pd.read_csv(CSV_DOSYASI, encoding='utf-8-sig')
    
    print(f"Toplam kayıt sayısı: {len(df)}")
    print(f"\nKategori dağılımı:")
    print(df['Kategori'].value_counts())
    
    # NaN değerleri temizle
    df = df.dropna(subset=['Kategori', 'Başlık', 'İçerik'])
    
    # Başlık ve İçeriği birleştir
    df['Mail_Metni'] = df['Başlık'] + " " + df['İçerik']
    
    # Metni temizle
    df['Mail_Metni'] = df['Mail_Metni'].apply(veri_temizle)
    
    # Boş metinleri çıkar
    df = df[df['Mail_Metni'].str.strip() != '']
    
    # X: mail metinleri, y: kategoriler
    X = df['Mail_Metni'].values
    y = df['Kategori'].values
    
    print(f"\nTemizlenmiş veri sayısı: {len(X)}")
    print(f"Kategori sayısı: {len(np.unique(y))}")
    
    return X, y


def model_karsilastir(X, y):
    """Farklı modelleri karşılaştır ve en iyisini seç"""
    print("\n" + "="*70)
    print("MODEL KARŞILAŞTIRMASI")
    print("="*70)
    
    # Veriyi train/test olarak ayır
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # TF-IDF Vektörizasyon
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),  # unigram ve bigram
        min_df=2,
        max_df=0.95
    )
    
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)
    
    print(f"\nÖzellik sayısı (TF-IDF): {X_train_tfidf.shape[1]}")
    
    # Modeller
    modeller = {
        'Naive Bayes': MultinomialNB(alpha=0.1),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        'SVM': SVC(kernel='linear', random_state=42, probability=True)
    }
    
    sonuclar = {}
    
    for isim, model in modeller.items():
        print(f"\n{isim} eğitiliyor...")
        
        # Modeli eğit
        model.fit(X_train_tfidf, y_train)
        
        # Tahmin yap
        y_pred = model.predict(X_test_tfidf)
        
        # Accuracy hesapla
        accuracy = accuracy_score(y_test, y_pred)
        sonuclar[isim] = {
            'model': model,
            'accuracy': accuracy,
            'y_pred': y_pred
        }
        
        print(f"  Accuracy: {accuracy:.4f}")
        
        # 5-fold cross validation
        cv_scores = cross_val_score(model, X_train_tfidf, y_train, cv=5, scoring='accuracy')
        print(f"  5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.2f})")
    
    # En iyi modeli seç
    en_iyi_isim = max(sonuclar.items(), key=lambda x: x[1]['accuracy'])[0]
    en_iyi_sonuc = sonuclar[en_iyi_isim]
    
    print(f"\n{'='*70}")
    print(f"EN İYİ MODEL: {en_iyi_isim} (Accuracy: {en_iyi_sonuc['accuracy']:.4f})")
    print(f"{'='*70}")
    
    # En iyi model için detaylı değerlendirme
    print("\nDetaylı Sınıflandırma Raporu:")
    print(classification_report(y_test, en_iyi_sonuc['y_pred']))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, en_iyi_sonuc['y_pred'])
    
    # Confusion Matrix görselleştirme
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=np.unique(y), yticklabels=np.unique(y))
    plt.title(f'Confusion Matrix - {en_iyi_isim}')
    plt.ylabel('Gerçek Kategori')
    plt.xlabel('Tahmin Edilen Kategori')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
    print("\nConfusion Matrix 'confusion_matrix.png' olarak kaydedildi.")
    
    return en_iyi_isim, en_iyi_sonuc['model'], vectorizer


def model_kaydet(model, vectorizer):
    """En iyi modeli ve vectorizer'ı kaydet"""
    print(f"\nModel kaydediliyor...")
    joblib.dump(model, MODEL_DOSYASI)
    joblib.dump(vectorizer, VECTORIZER_DOSYASI)
    print(f"✓ Model: {MODEL_DOSYASI}")
    print(f"✓ Vectorizer: {VECTORIZER_DOSYASI}")


def model_yukle():
    """Kaydedilmiş modeli ve vectorizer'ı yükle"""
    try:
        model = joblib.load(MODEL_DOSYASI)
        vectorizer = joblib.load(VECTORIZER_DOSYASI)
        return model, vectorizer
    except FileNotFoundError:
        print("Model bulunamadı! Önce eğitim yapmalısınız.")
        return None, None


def tahmin_yap(baslik, icerik, model=None, vectorizer=None):
    """Verilen başlık ve içerik için kategori tahmini yap"""
    if model is None or vectorizer is None:
        model, vectorizer = model_yukle()
    
    if model is None or vectorizer is None:
        return None, None
    
    # Metni birleştir ve temizle
    metin = baslik + " " + icerik
    metin = veri_temizle(metin)
    
    # Vectorize et
    X = vectorizer.transform([metin])
    
    # Tahmin yap
    olasilik = model.predict_proba(X)[0]
    
    # Kategoriler ve olasılıkları eşleştir
    kategoriler = model.classes_
    olasiliklar = {kategori: prob for kategori, prob in zip(kategoriler, olasilik)}
    
    # En yüksek olasılıklı kategoriyi seç
    tahmin = max(olasiliklar.items(), key=lambda x: x[1])[0]
    
    return tahmin, olasiliklar


def main():
    """Ana fonksiyon"""
    print("="*70)
    print("MAIL KATEGORİ TAHMİN MODELİ EĞİTİMİ")
    print("="*70)
    
    # Veriyi yükle
    X, y = veri_yukle()
    
    # Model karşılaştırması
    en_iyi_isim, en_iyi_model, vectorizer = model_karsilastir(X, y)
    
    # Modeli kaydet
    model_kaydet(en_iyi_model, vectorizer)
    
    print("\n" + "="*70)
    print("EĞİTİM TAMAMLANDI!")
    print("="*70)
    print("\nTahmin yapmak için 'python test_model.py' komutunu çalıştırın.")


if __name__ == "__main__":
    main()

