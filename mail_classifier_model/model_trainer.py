"""
Model eğitimi ve karşılaştırma fonksiyonları
"""

import numpy as np
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from time import time
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix,
                             f1_score, precision_score, recall_score)
import xgboost as xgb

from .config import (DEFAULT_NGRAM_RANGE, DEFAULT_MAX_FEATURES,
                     METRIKLER_DOSYASI, OZELLIK_ONEM_DOSYASI)


def model_olustur(ngram_range=None, max_features=None):
    """
    TF-IDF vektörizasyon oluştur
    
    Args:
        ngram_range: N-gram aralığı (varsayılan: config'ten gelir)
        max_features: Maksimum özellik sayısı (varsayılan: config'ten gelir)
        
    Returns:
        TfidfVectorizer: TF-IDF vektörizer
    """
    if ngram_range is None:
        ngram_range = DEFAULT_NGRAM_RANGE
    if max_features is None:
        max_features = DEFAULT_MAX_FEATURES
        
    return TfidfVectorizer(
        max_features=max_features,
        ngram_range=ngram_range,
        min_df=2,
        max_df=0.95,
        sublinear_tf=True
    )


def model_karsilastir(X, y, X_metrikler, temizleyici, metrik_cikarici):
    """
    Farklı modelleri karşılaştır ve en iyisini seç
    
    Args:
        X: Temizlenmiş mail metinleri
        y: Kategori etiketleri
        X_metrikler: Ek metrikler
        temizleyici: MetinTemizleyici örneği
        metrik_cikarici: MetrikCikarici örneği
        
    Returns:
        tuple: (en_iyi_isim, en_iyi_model, vectorizer, scaler, temizleyici, metrik_cikarici)
    """
    print("\n" + "="*70)
    print("MODEL KARŞILAŞTIRMASI")
    print("="*70)
    
    # Veriyi train/test olarak ayır
    X_train, X_test, y_train, y_test, X_train_met, X_test_met = train_test_split(
        X, y, X_metrikler, test_size=0.2, random_state=42, stratify=y
    )
    
    # Vectorizer (performans ve hız dengesi)
    vectorizer = model_olustur(ngram_range=(1, 3), max_features=12000)
    
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)
    
    # Metrikleri normalize et
    scaler = StandardScaler()
    X_train_met = scaler.fit_transform(X_train_met)
    X_test_met = scaler.transform(X_test_met)
    
    # TF-IDF ve metrikleri birleştir
    X_train_combined = np.hstack([X_train_tfidf.toarray(), X_train_met])
    X_test_combined = np.hstack([X_test_tfidf.toarray(), X_test_met])
    
    print(f"\nToplam özellik sayısı: {X_train_combined.shape[1]}")
    print(f"  - TF-IDF özellikleri: {X_train_tfidf.shape[1]}")
    print(f"  - Metrik özellikleri: {X_train_met.shape[1]}")
    
    # Label encoding for XGBoost
    unique_labels = np.unique(y_train)
    label_to_id = {label: i for i, label in enumerate(unique_labels)}
    y_train_encoded = np.array([label_to_id[label] for label in y_train])
    y_test_encoded = np.array([label_to_id[label] for label in y_test])
    
    # Modeller (hız ve performans dengesi için optimize edilmiş)
    modeller = {
        'Naive Bayes': MultinomialNB(alpha=0.1),
        'Logistic Regression': LogisticRegression(random_state=42, max_iter=300, class_weight='balanced', n_jobs=-1),
        'Random Forest': RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1, class_weight='balanced', max_depth=30),
        'Linear SVM': LinearSVC(random_state=42, class_weight='balanced', max_iter=1000, dual=False),
        'XGBoost': xgb.XGBClassifier(random_state=42, n_jobs=-1, eval_metric='mlogloss', n_estimators=50, max_depth=5)
    }
    
    sonuclar = {}
    
    for isim, model in modeller.items():
        print(f"\n{isim} eğitiliyor...")
        start_time = time()
        
        # XGBoost için encoded labels kullan
        if isim == 'XGBoost':
            y_train_current = y_train_encoded
            y_test_current = y_test_encoded
        else:
            y_train_current = y_train
            y_test_current = y_test
        
        # Naive Bayes için sadece TF-IDF kullan (negatif değer alamaz)
        if isim == 'Naive Bayes':
            X_train_model = X_train_tfidf
            X_test_model = X_test_tfidf
            X_train_res, y_train_res = X_train_model, y_train_current
        else:
            X_train_model = X_train_combined
            X_test_model = X_test_combined
            X_train_res, y_train_res = X_train_combined, y_train_current
        
        # Modeli eğit
        model.fit(X_train_res, y_train_res)
        fit_time = time() - start_time
        print(f"  Eğitim süresi: {fit_time:.2f} saniye")
        
        # Tahmin yap
        y_pred = model.predict(X_test_model)
        
        # XGBoost tahminlerini label'a çevir
        if isim == 'XGBoost':
            id_to_label = {i: label for label, i in label_to_id.items()}
            y_pred_labels = np.array([id_to_label[pred] for pred in y_pred])
        else:
            y_pred_labels = y_pred
            
        total_time = time() - start_time
        print(f"  Toplam süre: {total_time:.2f} saniye")
        
        # Metrikleri hesapla
        accuracy = accuracy_score(y_test, y_pred_labels)
        f1_macro = f1_score(y_test, y_pred_labels, average='macro')
        precision_macro = precision_score(y_test, y_pred_labels, average='macro')
        recall_macro = recall_score(y_test, y_pred_labels, average='macro')
        
        sonuclar[isim] = {
            'model': model,
            'accuracy': accuracy,
            'f1_macro': f1_macro,
            'precision_macro': precision_macro,
            'recall_macro': recall_macro,
            'y_pred': y_pred_labels,
            'scaler': scaler
        }
        
        print(f"  Accuracy: {accuracy:.4f}")
        print(f"  F1-Macro: {f1_macro:.4f}")
        print(f"  Precision-Macro: {precision_macro:.4f}")
        print(f"  Recall-Macro: {recall_macro:.4f}")
    
    # En iyi modeli seç (F1 score'a göre)
    en_iyi_isim = max(sonuclar.items(), key=lambda x: x[1]['f1_macro'])[0]
    en_iyi_sonuc = sonuclar[en_iyi_isim]
    
    print(f"\n{'='*70}")
    print(f"EN İYİ MODEL: {en_iyi_isim}")
    print(f"  Accuracy: {en_iyi_sonuc['accuracy']:.4f}")
    print(f"  F1-Macro: {en_iyi_sonuc['f1_macro']:.4f}")
    print(f"  Precision-Macro: {en_iyi_sonuc['precision_macro']:.4f}")
    print(f"  Recall-Macro: {en_iyi_sonuc['recall_macro']:.4f}")
    print(f"{'='*70}")
    
    # Metrikleri kaydet
    metrikler_dict = {
        'model': en_iyi_isim,
        'accuracy': float(en_iyi_sonuc['accuracy']),
        'f1_macro': float(en_iyi_sonuc['f1_macro']),
        'precision_macro': float(en_iyi_sonuc['precision_macro']),
        'recall_macro': float(en_iyi_sonuc['recall_macro']),
        'tarih': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    with open(METRIKLER_DOSYASI, 'w', encoding='utf-8') as f:
        json.dump(metrikler_dict, f, ensure_ascii=False, indent=2)
    
    # En iyi model için detaylı değerlendirme
    print("\nDetaylı Sınıflandırma Raporu:")
    print(classification_report(y_test, en_iyi_sonuc['y_pred']))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, en_iyi_sonuc['y_pred'])
    
    # Confusion Matrix görselleştirme
    plt.figure(figsize=(14, 12))
    cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
    
    sns.heatmap(cm_normalized, annot=True, fmt='.2f', cmap='Blues',
                xticklabels=np.unique(y), yticklabels=np.unique(y),
                cbar_kws={'label': 'Oran'})
    plt.title(f'Confusion Matrix (Normalized) - {en_iyi_isim}')
    plt.ylabel('Gerçek Kategori')
    plt.xlabel('Tahmin Edilen Kategori')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig('confusion_matrix_advanced.png', dpi=300, bbox_inches='tight')
    print("\nConfusion Matrix 'confusion_matrix_advanced.png' olarak kaydedildi.")
    
    # En çok karıştırılan kategoriler
    en_cok_karisik_kategoriler(cm, np.unique(y))
    
    # Feature importance (eğer varsa)
    if hasattr(en_iyi_sonuc['model'], 'feature_importances_'):
        ozellik_onemleri(vectorizer, en_iyi_sonuc['model'], 'feature_importances_', np.unique(y))
    elif hasattr(en_iyi_sonuc['model'], 'coef_'):
        ozellik_onemleri(vectorizer, en_iyi_sonuc['model'], 'coef_', np.unique(y))
    
    return en_iyi_isim, en_iyi_sonuc['model'], vectorizer, en_iyi_sonuc['scaler'], temizleyici, metrik_cikarici


def en_cok_karisik_kategoriler(cm, kategoriler):
    """En çok karıştırılan kategorileri bul"""
    print("\n" + "="*70)
    print("EN ÇOK KARIŞTIRILAN KATEGORİLER")
    print("="*70)
    
    hatalar = []
    for i in range(len(kategoriler)):
        for j in range(len(kategoriler)):
            if i != j and cm[i, j] > 0:
                gercek_kategori = kategoriler[i]
                yanlis_kategori = kategoriler[j]
                hata_sayisi = cm[i, j]
                hatalar.append({
                    'gercek': gercek_kategori,
                    'yanlis': yanlis_kategori,
                    'hata_sayisi': hata_sayisi,
                    'oran': hata_sayisi / cm[i].sum() if cm[i].sum() > 0 else 0
                })
    
    # En çok hata yapılanları sırala
    hatalar_sorted = sorted(hatalar, key=lambda x: x['hata_sayisi'], reverse=True)[:10]
    
    for idx, hata in enumerate(hatalar_sorted, 1):
        print(f"{idx}. {hata['gercek']} → {hata['yanlis']}: {hata['hata_sayisi']} hata (%{hata['oran']*100:.1f})")


def ozellik_onemleri(vectorizer, model, importance_type, kategoriler):
    """En önemli özellikleri (kelimeleri) göster"""
    print("\n" + "="*70)
    print("EN ÖNEMLİ ÖZELLİKLER (TOP 20)")
    print("="*70)
    
    # Feature names
    feature_names = np.array(vectorizer.get_feature_names_out())
    
    # Feature importance al
    if importance_type == 'feature_importances_':
        importances = model.feature_importances_
        # Sadece TF-IDF özelliklerini al (metrikleri hariç tut)
        importances = importances[:len(feature_names)]
    else:  # coef_
        # Coef için her sınıf için ortalama al
        importances = np.abs(model.coef_).mean(axis=0)
        importances = importances[:len(feature_names)]
    
    # En önemli özellikleri sırala
    indices = np.argsort(importances)[::-1][:20]
    
    print("\nEn önemli 20 kelime/özellik:")
    for idx, i in enumerate(indices, 1):
        print(f"{idx:2d}. {feature_names[i]:30s} - Önem: {importances[i]:.4f}")
    
    # CSV olarak kaydet
    df_importance = pd.DataFrame({
        'kelime': feature_names[indices],
        'onem': importances[indices]
    })
    df_importance.to_csv(OZELLIK_ONEM_DOSYASI, index=False, encoding='utf-8-sig')
    print(f"\nÖzellik önemleri '{OZELLIK_ONEM_DOSYASI}' olarak kaydedildi.")

