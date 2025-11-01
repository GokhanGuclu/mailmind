"""
Mail Kategorisi Tahmin Aracı
Eğitilmiş model ile tahmin yapar
"""

from mail_classifier import tahmin_yap, model_yukle
import sys

def main():
    """Ana tahmin fonksiyonu"""
    print("="*70)
    print("MAIL KATEGORİ TAHMİN ARACI")
    print("="*70)
    
    # Modeli yükle
    print("\nModel yükleniyor...")
    model, vectorizer = model_yukle()
    
    if model is None or vectorizer is None:
        print("⚠ Hata: Model bulunamadı!")
        print("   Önce 'python mail_classifier.py' komutu ile model eğitmelisiniz.")
        return
    
    print("✓ Model başarıyla yüklendi!")
    
    # Kullanıcıdan input al
    print("\n" + "="*70)
    print("TAHMIN YAPMA")
    print("="*70)
    print("(Çıkmak için 'q' veya 'quit' yazın)")
    
    while True:
        print("\n" + "-"*70)
        baslik = input("Mail Başlığı: ").strip()
        
        if baslik.lower() in ['q', 'quit', 'exit']:
            print("\nÇıkılıyor...")
            break
        
        if not baslik:
            print("⚠ Başlık boş olamaz!")
            continue
        
        icerik = input("Mail İçeriği: ").strip()
        
        if not icerik:
            print("⚠ İçerik boş olamaz!")
            continue
        
        # Tahmin yap
        print("\nTahmin yapılıyor...")
        try:
            tahmin, olasiliklar = tahmin_yap(baslik, icerik, model, vectorizer)
            
            if tahmin:
                print("\n" + "="*70)
                print(f"📧 TAHMİN EDİLEN KATEGORİ: {tahmin}")
                print(f"📊 Güven: {olasiliklar[tahmin]:.2%}")
                print("="*70)
                
                # En yüksek 3 kategori
                print("\nEn olası 3 kategori:")
                sirali = sorted(olasiliklar.items(), key=lambda x: x[1], reverse=True)[:3]
                for idx, (kategori, prob) in enumerate(sirali, 1):
                    bar_length = int(prob * 40)  # 40 karakterlik bar
                    bar = '█' * bar_length + '░' * (40 - bar_length)
                    print(f"{idx}. {kategori:25} {prob:>6.2%} {bar}")
            
        except Exception as e:
            print(f"⚠ Hata: {e}")


if __name__ == "__main__":
    main()

