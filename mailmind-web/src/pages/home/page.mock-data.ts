type HomeText = {
  heroTitleBefore: string;
  heroTitleHighlight: string;
  heroTitleAfter: string;
  heroLead: string;
  primaryCta: string;
  secondaryCta: string;
  whyTitle: string;
  whyLead: string;
  featureOneTitle: string;
  featureOneDesc: string;
  featureTwoTitle: string;
  featureTwoDesc: string;
  featureThreeTitle: string;
  featureThreeDesc: string;
  ctaTitle: string;
  ctaLead: string;
  ctaButton: string;
};

export const homePageContent: Record<'tr' | 'en', HomeText> = {
  tr: {
    heroTitleBefore: 'E-postalarınızı',
    heroTitleHighlight: 'Akıllıca',
    heroTitleAfter: 'Yönetin',
    heroLead:
      'MailMind ile e-postalarınızı otomatik olarak kategorilere ayırın, önemli mesajları kaçırmayın ve gelen kutunuzu düzenli tutun.',
    primaryCta: 'Hemen Başla',
    secondaryCta: 'Giriş Yap',
    whyTitle: 'Neden MailMind?',
    whyLead:
      'Makine öğrenmesi destekli otomatik kategorizasyon ile e-posta yönetiminizi kolaylaştırın.',
    featureOneTitle: 'Otomatik Kategorizasyon',
    featureOneDesc:
      'E-postalarınızı iş, finans, sosyal, promosyon ve spam kategorilerine otomatik olarak ayırın. Makine öğrenmesi algoritmaları ile yüksek doğruluk.',
    featureTwoTitle: 'Güçlü Arama',
    featureTwoDesc:
      'Elasticsearch destekli tam metin arama ile binlerce e-postanız arasında anında arama yapın. Gelişmiş filtreleme seçenekleri ile istediğinizi bulun.',
    featureThreeTitle: 'Güvenli ve Özel',
    featureThreeDesc:
      'Verileriniz tamamen güvende. Uçtan uca şifreleme ve güvenli bağlantılar ile e-postalarınızı güvenle yönetin.',
    ctaTitle: 'Hemen Başlayın',
    ctaLead: 'Ücretsiz hesap oluşturun ve e-posta yönetiminizi bir üst seviyeye taşıyın',
    ctaButton: 'Ücretsiz Kayıt Ol',
  },
  en: {
    heroTitleBefore: 'Manage your emails',
    heroTitleHighlight: 'smarter',
    heroTitleAfter: '',
    heroLead:
      'Automatically categorize messages, never miss what matters, and keep your inbox organized with MailMind.',
    primaryCta: 'Get started',
    secondaryCta: 'Sign in',
    whyTitle: 'Why MailMind?',
    whyLead:
      'Machine learning–powered categorization that makes email management effortless.',
    featureOneTitle: 'Automatic categorization',
    featureOneDesc:
      'Sort mail into work, finance, social, promotions, and spam—trained models deliver high accuracy.',
    featureTwoTitle: 'Powerful search',
    featureTwoDesc:
      'Full-text search backed by Elasticsearch across thousands of messages, with advanced filters.',
    featureThreeTitle: 'Secure and private',
    featureThreeDesc:
      'Your data stays protected with encryption in transit and at rest, and secure connections.',
    ctaTitle: 'Get started today',
    ctaLead: 'Create a free account and take your inbox to the next level',
    ctaButton: 'Register for free',
  },
};
