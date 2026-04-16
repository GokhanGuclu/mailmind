type ConnectMailText = {
  title: string;
  subtitle: string;
  gmailTitle: string;
  gmailDesc: string;
  outlookTitle: string;
  outlookDesc: string;
  icloudTitle: string;
  icloudDesc: string;
  imapTitle: string;
  imapDesc: string;
  soonBadge: string;
  infoTitle: string;
  infoBody: string;
};

export const connectMailPageContent: Record<'tr' | 'en', ConnectMailText> = {
  tr: {
    title: 'E-posta Hesabınızı Bağlayın',
    subtitle: "MailMind'i kullanmaya başlamak için e-posta hesabınızı bağlayın",
    gmailTitle: 'Gmail',
    gmailDesc: 'Gmail hesabınızı OAuth ile güvenli şekilde bağlayın',
    outlookTitle: 'Outlook',
    outlookDesc: 'Yakında kullanıma açılacak',
    icloudTitle: 'iCloud Mail',
    icloudDesc: 'Yakında kullanıma açılacak',
    imapTitle: 'Manuel Bağlantı (IMAP)',
    imapDesc:
      'IMAP ve SMTP ayarlarınızla özel sunucunuzu veya alan adınızı bağlayın',
    soonBadge: 'Yakında',
    infoTitle: 'Güvenli Bağlantı',
    infoBody:
      'OAuth ile bağlandığınızda şifrenizi paylaşmadan hesabınıza güvenli erişim sağlanır.',
  },
  en: {
    title: 'Connect your email account',
    subtitle: 'Connect your mailbox to start using MailMind',
    gmailTitle: 'Gmail',
    gmailDesc: 'Connect your Gmail account securely with OAuth',
    outlookTitle: 'Outlook',
    outlookDesc: 'Coming soon',
    icloudTitle: 'iCloud Mail',
    icloudDesc: 'Coming soon',
    imapTitle: 'Manual connection (IMAP)',
    imapDesc: 'Connect your domain or custom server with IMAP and SMTP',
    soonBadge: 'Soon',
    infoTitle: 'Secure connection',
    infoBody:
      'With OAuth you get secure access without sharing your password.',
  },
};
