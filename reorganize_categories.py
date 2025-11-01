import pandas as pd

# Yeni kategori eşleştirmeleri
KATEGORI_ESLESME = {
    # İş ve Acil birleşti
    'İş': 'İş/Acil',
    'Acil': 'İş/Acil',
    
    # Güvenlik/Uyarı aynı kalıyor
    'Güvenlik/Uyarı': 'Güvenlik/Uyarı',
    
    # Reklam ve Alışveriş birleşti
    'Reklam': 'Pazarlama',
    'Alışveriş': 'Pazarlama',
    
    # Sosyal Medya aynı kalıyor
    'Sosyal Medya': 'Sosyal Medya',
    
    # Spam aynı kalıyor
    'Spam': 'Spam',
    
    # Üyelik/Abonelik ve Fatura birleşti
    'Üyelik/Abonelik': 'Abonelik/Fatura',
    'Fatura': 'Abonelik/Fatura',
    
    # Kişisel aynı kalıyor
    'Kişisel': 'Kişisel',
    
    # Eğitim/Öğretim aynı kalıyor
    'Eğitim/Öğretim': 'Eğitim/Öğretim',
    
    # Sağlık aynı kalıyor (varsa)
    'Sağlık': 'Sağlık',
    
    # Diğer aynı kalıyor
    'Diğer': 'Diğer'
}

def reorganize_categories(csv_dosyasi='mailler.csv', yeni_dosya='mailler.csv'):
    """Mail kategorilerini yeniden düzenle"""
    print("="*70)
    print("KATEGORİ YENİDEN DÜZENLEME")
    print("="*70)
    
    # CSV dosyasını oku
    print(f"\n📂 '{csv_dosyasi}' dosyası okunuyor...")
    df = pd.read_csv(csv_dosyasi, encoding='utf-8-sig')
    
    print(f"Toplam kayıt sayısı: {len(df)}")
    print("\nMevcut kategori dağılımı:")
    print(df['Kategori'].value_counts())
    
    # Kategorileri değiştir
    df['Yeni_Kategori'] = df['Kategori'].map(KATEGORI_ESLESME)
    
    # Eşleşmemiş kategorileri kontrol et
    eslesmeyen = df[df['Yeni_Kategori'].isna()]
    if not eslesmeyen.empty:
        print("\n⚠️  UYARI: Eşleşmeyen kategoriler bulundu!")
        print(eslesmeyen['Kategori'].value_counts())
        print("\nBu kategoriler 'Diğer' olarak işaretlenecek.")
        df['Yeni_Kategori'] = df['Yeni_Kategori'].fillna('Diğer')
    
    # Eski kategoriyi yeni ile değiştir
    df['Kategori'] = df['Yeni_Kategori']
    df = df.drop('Yeni_Kategori', axis=1)
    
    print("\n\nYeni kategori dağılımı:")
    print(df['Kategori'].value_counts())
    
    # Kaydet
    print(f"\n💾 '{yeni_dosya}' dosyasına kaydediliyor...")
    df.to_csv(yeni_dosya, index=False, encoding='utf-8-sig')
    
    print("\n✅ Kategori yeniden düzenleme tamamlandı!")
    print("="*70)
    
    # Özet
    print("\n📊 ÖZET:")
    print(f"Toplam kayıt: {len(df)}")
    print(f"Yeni kategori sayısı: {df['Kategori'].nunique()}")
    print(f"\nYeni kategoriler:")
    for kategori in sorted(df['Kategori'].unique()):
        sayi = len(df[df['Kategori'] == kategori])
        print(f"  - {kategori}: {sayi} mail")
    
    return df


if __name__ == "__main__":
    # Yedek al
    import shutil
    import os
    import glob
    from datetime import datetime
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    yedek_dosya = f'mailler_backup_{timestamp}.csv'
    
    print("🔄 Yedek dosyası oluşturuluyor...")
    shutil.copy('mailler.csv', yedek_dosya)
    print(f"✅ Yedek: {yedek_dosya}")
    
    # Kategorileri yeniden düzenle
    df = reorganize_categories('mailler.csv', 'mailler.csv')
    
    # Eski model dosyalarını temizle
    print("\n🗑️  Eski model dosyaları temizleniyor...")
    
    # Silinecek dosyalar
    silinecek_dosyalar = [
        'mail_model.pkl',
        'mail_vectorizer.pkl',
        'confusion_matrix.png',
        'confusion_matrix_advanced.png'
    ]
    
    # Model klasöründeki dosyalar
    model_klasor_dosyalari = [
        'model/mail_model_advanced.pkl',
        'model/mail_vectorizer_advanced.pkl',
        'model/scaler_advanced.pkl',
        'model/temizleyici_advanced.pkl',
        'model/metrik_cikarici_advanced.pkl',
        'model/label_to_id_advanced.npy',
        'model/id_to_label_advanced.npy',
        'model/metrikler_advanced.json',
        'model/ozellik_onemleri.csv',
        'model/confusion_matrix_advanced.png'
    ]
    
    silinen = 0
    for dosya in silinecek_dosyalar + model_klasor_dosyalari:
        if os.path.exists(dosya):
            os.remove(dosya)
            print(f"  ✓ {dosya}")
            silinen += 1
    
    print(f"\n✅ {silinen} dosya silindi!")
    
    print("\n🎉 İşlem tamamlandı!")
    print(f"\nÖnemli: Modeli yeniden eğitmeniz gerekecek:")
    print("  python mail_classifier_advanced.py")

