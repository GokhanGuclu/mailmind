"""
Tahmin fonksiyonları
"""

import numpy as np
from .model_manager import model_yukle


def tahmin_yap(baslik, icerik, model=None, vectorizer=None, scaler=None, 
                temizleyici=None, metrik_cikarici=None):
    """
    Verilen başlık ve içerik için kategori tahmini yap
    
    Args:
        baslik: E-posta başlığı
        icerik: E-posta içeriği
        model: Eğitilmiş model (opsiyonel, None ise yüklenir)
        vectorizer: TF-IDF vektörizer (opsiyonel)
        scaler: StandardScaler (opsiyonel)
        temizleyici: MetinTemizleyici (opsiyonel)
        metrik_cikarici: MetrikCikarici (opsiyonel)
        
    Returns:
        tuple: (tahmin, olasiliklar)
            tahmin: En yüksek olasılıklı kategori
            olasiliklar: Tüm kategoriler için olasılıklar dict'i
    """
    # Model yüklenmemişse yükle
    if model is None:
        model, vectorizer, scaler, temizleyici, metrik_cikarici = model_yukle()
    
    if model is None or vectorizer is None:
        return None, None
    
    # Metni birleştir ve temizle
    metin = baslik + " " + icerik
    metin_temiz = temizleyici.transform([metin])[0]
    
    # Vectorize et
    X_tfidf = vectorizer.transform([metin_temiz])
    
    # Metrikleri çıkar ve normalize et
    X_metrik = metrik_cikarici.transform([metin])
    X_metrik = scaler.transform(X_metrik)
    
    # Birleştir
    X_combined = np.hstack([X_tfidf.toarray(), X_metrik])
    
    # Tahmin yap
    if hasattr(model, 'predict_proba'):
        olasilik = model.predict_proba(X_combined)[0]
    else:
        # LinearSVC gibi olasılık vermeyen modeller için
        # decision_function kullan ve normalize et
        decision_scores = model.decision_function(X_combined)[0]
        # Softmax benzeri normalizasyon
        exp_scores = np.exp(decision_scores - np.max(decision_scores))
        olasilik = exp_scores / np.sum(exp_scores)
    
    # Kategoriler ve olasılıkları eşleştir
    kategoriler = model.classes_
    olasiliklar = {kategori: prob for kategori, prob in zip(kategoriler, olasilik)}
    
    # En yüksek olasılıklı kategoriyi seç
    tahmin = max(olasiliklar.items(), key=lambda x: x[1])[0]
    
    return tahmin, olasiliklar

