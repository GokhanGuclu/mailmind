"""
Basit ve gelişmiş modellerin kısa karşılaştırması için yardımcı script
"""
import pandas as pd
import mail_classifier  # Modülü yükle (pickle için gerekli)
# Modüler yapıdan import et
from mail_classifier import veri_yukle as veri_yukle_basic
from mail_classifier import tahmin_yap as tahmin_basic
from mail_classifier_model import tahmin_yap as tahmin_advanced

def main():
    """Model karşılaştırması yap"""
    print("="*70)
    print("MODEL KARŞILAŞTIRMASI")
    print("="*70)
    
    # Test verileri
    test_mailler = [
        {
            'baslik': 'Siparişiniz onaylandı!',
            'icerik': 'Merhaba, siparişiniz başarıyla alınmıştır. Sipariş numaranız: 12345.',
            'beklenen': 'Alışveriş'
        },
        {
            'baslik': 'Sınav sonuçları açıklandı',
            'icerik': 'Sınav sonuçlarınız öğrenci bilgi sistemine yüklenmiştir.',
            'beklenen': 'Eğitim/Öğretim'
        },
        {
            'baslik': 'Toplantı daveti',
            'icerik': 'Yarın saat 14:00\'te proje sunumu toplantısı yapılacaktır.',
            'beklenen': 'İş'
        }
    ]
    
    print("\nModel yükleniyor...")
    
    # Temel modeli test et
    print("\n--- TEMEL MODEL TEST ---")
    try:
        for idx, test in enumerate(test_mailler, 1):
            tahmin, olasiliklar = tahmin_basic(test['baslik'], test['icerik'])
            if tahmin:
                dogru = "✓" if tahmin == test['beklenen'] else "✗"
                print(f"{idx}. {dogru} Tahmin: {tahmin} | Beklenen: {test['beklenen']}")
            else:
                print(f"{idx}. ✗ Model yüklü değil")
    except Exception as e:
        print(f"Temel model hatası: {e}")
    
    # Gelişmiş modeli test et
    print("\n--- GELİŞMİŞ MODEL TEST ---")
    try:
        for idx, test in enumerate(test_mailler, 1):
            tahmin, olasiliklar = tahmin_advanced(test['baslik'], test['icerik'])
            if tahmin:
                dogru = "✓" if tahmin == test['beklenen'] else "✗"
                print(f"{idx}. {dogru} Tahmin: {tahmin} | Beklenen: {test['beklenen']}")
            else:
                print(f"{idx}. ✗ Model yüklü değil")
    except Exception as e:
        print(f"Gelişmiş model hatası: {e}")
    
    print("\n" + "="*70)
    print("Not: Modellerin karşılaştırılması için önce her ikisini de eğitmelisiniz:")
    print("  - Temel: python mail_classifier.py")
    print("  - Gelişmiş: python mail_classifier_advanced.py")
    print("="*70)


if __name__ == "__main__":
    main()

