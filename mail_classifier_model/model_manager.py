"""
Model kaydetme ve yükleme fonksiyonları
"""

import os
import sys
import joblib
from .config import (MODEL_DIR, MODEL_DOSYASI, VECTORIZER_DOSYASI, SCALER_DOSYASI,
                     TEMIZLEYICI_DOSYASI, METRIK_CIKARICI_DOSYASI)


def model_kaydet(model, vectorizer, scaler, temizleyici, metrik_cikarici):
    """
    En iyi modeli ve tüm bileşenleri kaydet
    
    Args:
        model: Eğitilmiş model
        vectorizer: TF-IDF vektörizer
        scaler: StandardScaler
        temizleyici: MetinTemizleyici
        metrik_cikarici: MetrikCikarici
    """
    # Model klasörünü oluştur (eğer yoksa)
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    print(f"\nModel kaydediliyor...")
    joblib.dump(model, MODEL_DOSYASI)
    joblib.dump(vectorizer, VECTORIZER_DOSYASI)
    joblib.dump(scaler, SCALER_DOSYASI)
    joblib.dump(temizleyici, TEMIZLEYICI_DOSYASI)
    joblib.dump(metrik_cikarici, METRIK_CIKARICI_DOSYASI)
    print(f"✓ Model: {MODEL_DOSYASI}")
    print(f"✓ Vectorizer: {VECTORIZER_DOSYASI}")
    print(f"✓ Scaler: {SCALER_DOSYASI}")
    print(f"✓ Temizleyici: {TEMIZLEYICI_DOSYASI}")
    print(f"✓ Metrik Çıkarıcı: {METRIK_CIKARICI_DOSYASI}")


def model_yukle():
    """
    Kaydedilmiş modeli ve tüm bileşenleri yükle
    
    Returns:
        tuple: (model, vectorizer, scaler, temizleyici, metrik_cikarici)
            Veya (None, None, None, None, None) hata durumunda
    """
    try:
        # Pickle için modül referansını düzelt
        # Mevcut modülü __main__'e eşle (geriye dönük uyumluluk için)
        import mail_classifier_model.preprocessing as mcp
        sys.modules['__main__'] = mcp
        
        model = joblib.load(MODEL_DOSYASI)
        vectorizer = joblib.load(VECTORIZER_DOSYASI)
        scaler = joblib.load(SCALER_DOSYASI)
        temizleyici = joblib.load(TEMIZLEYICI_DOSYASI)
        metrik_cikarici = joblib.load(METRIK_CIKARICI_DOSYASI)
        return model, vectorizer, scaler, temizleyici, metrik_cikarici
    except FileNotFoundError as e:
        print(f"Model bulunamadı! Önce eğitim yapmalısınız. Hata: {e}")
        return None, None, None, None, None
    except Exception as e:
        print(f"Model yükleme hatası: {e}")
        print("Not: Eski modeller farklı bir yapıda kaydedilmiş olabilir.")
        return None, None, None, None, None

