import type { LanguageMode } from '../../shared/types/ui';
import type { WidgetKind } from './dashboard/types';
import { OPENAI_PLUS_EMAIL_INNER_HTML, OPENAI_PLUS_EMAIL_PLAIN_TEXT } from './openai-plus-inbox-demo';

/** `monthOffset`: bugünkü aya göre (0 = bu ay, -1 = geçen ay, +2 = iki ay sonra). */
export type CalendarEventSeed = {
  monthOffset: number;
  day: number;
  time: string;
  title: string;
};

/** Yıldan bağımsız tekrarlayan özel günler (ay 0–11). */
export type CalendarSpecialDaySeed = {
  month: number;
  day: number;
  title: string;
  description: string;
};

/** Gelen kutusu mock örnek satırları (dil ile uyumlu). */
export type InboxMockRow = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  bodyText?: string;
  attachmentNames?: string[];
  aiSummary?: string;
};

/** Taslaklar: ilk sütunda alıcı e-postası; yoksa `draftsNoRecipientLabel`. */
export type DraftMockRow = {
  id: string;
  /** Kime gönderileceği; boş/yoksa taslak etiketi gösterilir */
  toEmail?: string | null;
  subject: string;
  preview: string;
  time: string;
  bodyText?: string;
  attachmentNames?: string[];
  aiSummary?: string;
};

/** Gelen kutusu liste satırı: Gmail benzeri konu + önizleme + isteğe bağlı ekler. */
export type GeneralInboxRow = {
  id: string;
  /** Gösterim için; boşsa `senderEmail` kullanılır */
  senderName?: string | null;
  senderEmail: string;
  /** Kalın satır başlığı */
  subject: string;
  /** Konudan sonra “ - ” ile gösterilen gri özet */
  preview: string;
  /** Tam ileti gövdesi (paragraflar `\n\n` ile ayrılabilir) */
  bodyText: string;
  /** Varsa okuyucuda güvenli HTML olarak gösterilir (düz metin yedeği `bodyText`) */
  bodyHtml?: string | null;
  /** Okuyucuda AI özeti kutusu (yoksa önizlemeden türetilir) */
  aiSummary?: string;
  /** 0 = bugün, 1 = dün, … (yerel tarihe göre) */
  sentDayOffset: number;
  /** HH:mm */
  sentClock: string;
  attachmentNames?: string[];
};

export type MailDashboardCopy = {
  pageTitle: string;
  activePanelTitle: string;
  activePanelHint: string;
  resetLayout: string;
  resetConfirm: string;
  sidebarBrand: string;
  /** Sol menü: düz posta (özelleştirme yok) */
  navGeneralInbox: string;
  /** Sol menü / navbar: widget panosu */
  navDashboard: string;
  /** Takvim sayfası */
  navCalendar: string;
  navStarred: string;
  navSpam: string;
  navSent: string;
  navDrafts: string;
  navTrash: string;
  /** Sol menü: yeni posta (compose) */
  navNewMail: string;
  /** Yeni posta ekranı (bölge etiketi) */
  composeRegionAria: string;
  composeTitle: string;
  composeToLabel: string;
  composeSubjectLabel: string;
  composeBodyLabel: string;
  composeSend: string;
  composeClose: string;
  composeBackAria: string;
  composeMockHint: string;
  /** Sol sidebar küçük başlık (Posta / Mail) */
  mailSidebarTitle: string;
  navHome: string;
  navConnect: string;
  /** Navbar arama kutusu */
  navSearchPlaceholder: string;
  /** Navbar profil düğmesi */
  navProfile: string;
  /** Profil menüsü: çıkış yap */
  navLogout: string;
  /** Tam sayfa takvim: bugüne dön */
  calendarPageToday: string;
  /** Tam sayfa takvim: henüz gün seçilmedi */
  calendarPageSidebarEmpty: string;
  /** Gelen kutusu: ek satırı etiketi */
  inboxAttachmentsLabel: string;
  /** Açık ileti: listeye dön */
  inboxBackToListAria: string;
  /** Açık ileti okuma alanı (bölge etiketi) */
  inboxMessageReaderRegionAria: string;
  /** Açık ileti üst çubuğu: arşiv / spam / sil grubu */
  inboxReaderMessageActionsAria: string;
  /** Satır onay kutusu */
  inboxSelectRowAria: string;
  /** Satır yıldız */
  inboxStarRowAria: string;
  /** Gelen kutusu üst araç çubuğu */
  inboxToolbarAria: string;
  /** Gönderilmiş klasörü araç çubuğu */
  sentToolbarAria: string;
  draftsToolbarAria: string;
  trashToolbarAria: string;
  /** Çöp kutusu: kalıcı sil / geri dönüştür */
  trashBulkPermanentDeleteAria: string;
  trashBulkRestoreAria: string;
  /** Taslakta alıcı yazılmadığında ilk sütunda gösterilen metin */
  draftsNoRecipientLabel: string;
  /** Okuyucuda gönderilmiş / taslak: "Kime:" öneki */
  readerToPrefix: string;
  /** AI özeti kutusu etiketi */
  readerAiSummaryLabel: string;
  /** AI özeti bölgesi (erişilebilirlik) */
  readerAiSummaryAria: string;
  /** Spam klasörü: özet yerine gösterilen uyarı metni */
  readerSpamNoAiSummaryText: string;
  /** Spam klasörü: özet kutusu bölge etiketi */
  readerSpamAiSummaryAria: string;
  /** Tüm iletileri seç / seçimi kaldır */
  inboxSelectAllAria: string;
  /** Seçim menüsü (tümü / hiçbiri vb.) */
  inboxSelectionMenuAria: string;
  inboxRefreshAria: string;
  inboxMoreActionsAria: string;
  inboxPagePrevAria: string;
  inboxPageNextAria: string;
  /** Sayfa aralığı: {{start}}, {{end}}, {{total}} */
  inboxPageRangeTemplate: string;
  /** Toplam ileti yokken */
  inboxPageRangeEmpty: string;
  /** Toplu seçim: araç çubuğu eylemleri */
  inboxBulkArchiveAria: string;
  inboxBulkDeleteAria: string;
  inboxBulkSpamAria: string;
  inboxBulkMarkReadAria: string;
  /** Seçili tüm iletilerin işaretini kaldır */
  inboxClearSelectionAria: string;
  /** Gelen kutusu: HTML gövdeli iletide liste satırı rozet başlığı */
  inboxHtmlBadgeTitle: string;
  /** Spam klasörü: toplu işlem — gelen kutusuna geri al */
  spamBulkNotSpamLabel: string;
  /** Sağ widget panelini gizle */
  widgetPanelCollapse: string;
  /** Gizli widget panelini tekrar göster */
  widgetPanelExpand: string;
  emptyDashboard: string;
  widgetTitles: Record<WidgetKind, string>;
  /** İkon kutusu altı kısa etiket */
  widgetShortLabels: Record<WidgetKind, string>;
  toggleStateOn: string;
  toggleStateOff: string;
  editModeLabel: string;
  editModeEnterHint: string;
  editModeExitHint: string;
  mock: {
    sampleSubject: string;
    samplePreview: string;
    statDaily: string;
    statRatio: string;
    /** Haftanın günleri: Pazartesi–Pazar (TR) / Mon–Sun (EN). */
    calendarWeekdays: string[];
    calendarEventSeeds: CalendarEventSeed[];
    calendarSpecialDaySeeds: CalendarSpecialDaySeed[];
    calendarNoEvents: string;
    calendarPrevMonth: string;
    calendarNextMonth: string;
    calendarClosePopover: string;
    calendarSectionHoliday: string;
    calendarSectionEvents: string;
    taskLine1: string;
    taskLine2: string;
    taskDeadline: string;
    quickNewMail: string;
    quickFilter: string;
    quickSearch: string;
    /** Gelen kutusu sayfası örnek iletileri */
    inboxMockRows: GeneralInboxRow[];
    spamMockRows: InboxMockRow[];
    draftsMockRows: DraftMockRow[];
  };
};

/** Gelen kutusu: tekrarlanan örnek satır sayısı; sonuna ayrıca HTML5 örnek iletisi eklenir */
const INBOX_MOCK_ROW_COUNT = 70;
const DRAFTS_MOCK_ROW_COUNT = 70;

/** Aynı örnek satırı `count` kez üretir (benzersiz `id`). */
function repeatInboxMockRow(seed: Omit<GeneralInboxRow, 'id'>, count: number): GeneralInboxRow[] {
  return Array.from({ length: count }, (_, i) => ({
    ...seed,
    id: `mock-${i + 1}`,
  }));
}

function repeatDraftsMockRows(rows: DraftMockRow[], count: number): DraftMockRow[] {
  if (rows.length === 0) return [];
  if (rows.length >= count) return rows.slice(0, count);
  return Array.from({ length: count }, (_, i) => ({
    ...rows[i % rows.length],
    id: `draft-${i + 1}`,
  }));
}

const trInboxMockSeed: Omit<GeneralInboxRow, 'id'> = {
  senderName: 'Ali Başaran',
  senderEmail: 'ali.basaran@acme.com',
  subject: 'Hoş geldiniz',
  preview: 'Ekibimize katıldığınız için çok mutluyuz; ilk gününüzde size yardımcı olacağız.',
  bodyText:
    'Merhaba,\n\nEkibimize hoş geldiniz. İlk gününüzde IT ve İK ile tanışmanız için saat 10:00’da kısa bir toplantı planladık.\n\nEkteki belgeleri incelemenizi rica ederiz. Sorularınız için bu iletiyi yanıtlayabilirsiniz.\n\nSevgiler,\nAli',
  sentDayOffset: 0,
  sentClock: '09:12',
  attachmentNames: ['sozlesme.pdf', 'kurallar.docx'],
};

const enInboxMockSeed: Omit<GeneralInboxRow, 'id'> = {
  senderName: 'Jane Doe',
  senderEmail: 'jane.doe@acme.com',
  subject: 'Welcome aboard',
  preview: 'We are excited to have you on the team.',
  aiSummary:
    'Welcome email: intro meeting with IT/HR at 10:00 on your first day; contract and handbook attached; reply with questions.',
  bodyText:
    'Hi,\n\nWelcome to the team. We have scheduled a short intro with IT and HR at 10:00 AM on your first day.\n\nPlease review the attached documents. Reply to this message if you have any questions.\n\nBest,\nJane',
  sentDayOffset: 0,
  sentClock: '09:12',
  attachmentNames: ['contract.pdf', 'handbook.docx'],
};

/** Liste sonunda: gerçek EML’den (OpenAI / ChatGPT) çıkarılmış HTML gövde */
const trInboxHtmlDemoRow: GeneralInboxRow = {
  id: 'mock-71',
  senderName: 'OpenAI',
  senderEmail: 'noreply@tm.openai.com',
  subject: 'Plus erişimin yakında sona erecek',
  preview: 'Plus planını kullanmaya devam etmek için ödeme yöntemini güncelle.',
  aiSummary:
    'ChatGPT Plus yenileme: ödeme yöntemini güncelleme çağrısı; HTML tablo düzeni ve izleme pikseli içeren orijinal gönderici şablonu.',
  bodyText: OPENAI_PLUS_EMAIL_PLAIN_TEXT,
  bodyHtml: OPENAI_PLUS_EMAIL_INNER_HTML,
  sentDayOffset: 0,
  sentClock: '18:45',
};

const enInboxHtmlDemoRow: GeneralInboxRow = {
  id: 'mock-71',
  senderName: 'OpenAI',
  senderEmail: 'noreply@tm.openai.com',
  subject: 'Plus erişimin yakında sona erecek',
  preview: 'Plus planını kullanmaya devam etmek için ödeme yöntemini güncelle.',
  aiSummary:
    'ChatGPT Plus renewal notice (same HTML as source .eml): payment method update CTA, marketing layout.',
  bodyText: OPENAI_PLUS_EMAIL_PLAIN_TEXT,
  bodyHtml: OPENAI_PLUS_EMAIL_INNER_HTML,
  sentDayOffset: 0,
  sentClock: '18:45',
};

const trDraftsMockSeeds: DraftMockRow[] = [
  {
    id: 'd1',
    toEmail: null,
    subject: 'Proje notları (taslak)',
    preview: 'Buraya taslak metniniz gelir…',
    time: 'Kaydedildi',
    bodyText: 'Buraya taslak metniniz gelir…\n\nAlıcı eklenince gönderebilirsiniz.',
  },
  {
    id: 'd2',
    toEmail: 'musteri@firma.com.tr',
    subject: 'Müşteriye yanıt',
    preview: 'Merhaba, talebiniz için teşekkürler…',
    time: 'Kaydedildi',
    bodyText:
      'Merhaba,\n\nTalebiniz için teşekkür ederiz. Detayları aşağıda özetledik.\n\nSaygılarımla',
  },
  {
    id: 'd3',
    toEmail: 'ekip@acme.com',
    subject: 'Toplantı daveti',
    preview: 'Takvim için uygun saatleri paylaşır mısınız?',
    time: '10:44',
    bodyText:
      'Merhaba ekip,\n\nYakın zamanda kısa bir toplantı planlamak istiyorum. Uygun olduğunuz saatleri paylaşır mısınız?\n\nTeşekkürler',
  },
];

const enDraftsMockSeeds: DraftMockRow[] = [
  {
    id: 'd1',
    toEmail: null,
    subject: 'Project notes (draft)',
    preview: 'Your draft text goes here…',
    time: 'Saved',
    bodyText: 'Your draft text goes here…\n\nAdd a recipient when you are ready to send.',
  },
  {
    id: 'd2',
    toEmail: 'customer@company.com',
    subject: 'Reply to customer',
    preview: 'Hi, thanks for your request…',
    time: 'Saved',
    bodyText:
      'Hi,\n\nThanks for your request. Here is a short summary of the next steps.\n\nBest regards',
  },
  {
    id: 'd3',
    toEmail: 'team@acme.com',
    subject: 'Meeting invite',
    preview: 'Could you share your availability?',
    time: '10:44 AM',
    bodyText:
      'Hi team,\n\nI’d like to schedule a short meeting soon. Could you share your availability?\n\nThanks',
  },
];

const tr: MailDashboardCopy = {
  pageTitle: 'Gelen kutusu',
  navGeneralInbox: 'Gelen kutusu',
  mailSidebarTitle: 'Posta',
  activePanelTitle: "Widget'lar",
  activePanelHint: 'İkona tıklayın: açıkken panoda, kapalıyken gizli.',
  resetLayout: 'Düzeni sıfırla',
  resetConfirm:
    'Özel düzeniniz silinip varsayılan yerleşime dönülecek. Devam edilsin mi?',
  sidebarBrand: 'MailMind',
  navDashboard: 'Pano',
  navCalendar: 'Takvim',
  navStarred: 'Yıldızlılar',
  navSpam: 'Spam',
  navSent: 'Gönderilmiş',
  navDrafts: 'Taslaklar',
  navTrash: 'Çöp kutusu',
  navNewMail: 'Yeni posta',
  composeRegionAria: 'Yeni posta',
  composeTitle: 'Yeni posta',
  composeToLabel: 'Kime',
  composeSubjectLabel: 'Konu',
  composeBodyLabel: 'İleti',
  composeSend: 'Gönder',
  composeClose: 'Kapat',
  composeBackAria: 'Geri dön',
  composeMockHint: '',
  navHome: 'Ana sayfa',
  navConnect: 'Hesap bağla',
  navSearchPlaceholder: 'Posta ve kişilerde ara…',
  navProfile: 'Profil',
  navLogout: 'Çıkış Yap',
  calendarPageToday: 'Bugüne git',
  calendarPageSidebarEmpty: 'Detaylar için takvimden bir gün seçin.',
  inboxAttachmentsLabel: 'Ekler',
  inboxBackToListAria: 'Listeye dön',
  inboxMessageReaderRegionAria: 'İleti içeriği',
  inboxReaderMessageActionsAria: 'İleti işlemleri',
  inboxSelectRowAria: 'İletiyi seç',
  inboxStarRowAria: 'Yıldızla',
  inboxToolbarAria: 'Gelen kutusu araç çubuğu',
  sentToolbarAria: 'Gönderilmiş araç çubuğu',
  draftsToolbarAria: 'Taslaklar araç çubuğu',
  trashToolbarAria: 'Çöp kutusu araç çubuğu',
  trashBulkPermanentDeleteAria: 'Kalıcı olarak sil',
  trashBulkRestoreAria: 'Geri dönüştür',
  draftsNoRecipientLabel: 'Taslak',
  readerToPrefix: 'Kime:',
  readerAiSummaryLabel: 'AI Özeti:',
  readerAiSummaryAria: 'Yapay zeka ile oluşturulmuş kısa özet',
  readerSpamNoAiSummaryText: 'Bu mail spam içeriklidir; AI özeti yapılmamaktadır.',
  readerSpamAiSummaryAria: 'Spam uyarısı',
  inboxSelectAllAria: 'Tüm iletileri seç',
  inboxSelectionMenuAria: 'Seçim seçenekleri',
  inboxRefreshAria: 'Yenile',
  inboxMoreActionsAria: 'Diğer işlemler',
  inboxPagePrevAria: 'Önceki sayfa',
  inboxPageNextAria: 'Sonraki sayfa',
  inboxPageRangeTemplate: '{{start}}-{{end}}/{{total}}',
  inboxPageRangeEmpty: '0 ileti',
  inboxBulkArchiveAria: 'Arşivle',
  inboxBulkDeleteAria: 'Sil',
  inboxBulkSpamAria: 'Spam bildir',
  inboxBulkMarkReadAria: 'Okundu olarak işaretle',
  inboxClearSelectionAria: 'Tüm seçimi kaldır',
  inboxHtmlBadgeTitle: 'HTML5 gövde',
  spamBulkNotSpamLabel: 'Spam değil',
  widgetPanelCollapse: 'Widget panelini gizle',
  widgetPanelExpand: 'Widget panelini göster',
  emptyDashboard: 'Hiç widget açık değil. Sağ panelden en az birini açın.',
  toggleStateOn: 'açık',
  toggleStateOff: 'kapalı',
  editModeLabel: 'Düzenleme modu',
  editModeEnterHint: 'Aç: widget yerini ve boyutunu değiştir',
  editModeExitHint: 'Kapat: düzeni kilitle',
  widgetShortLabels: {
    inbox: 'Inbox',
    unread: 'Okunm.',
    starred: 'Yıldız',
    calendar: 'Takvim',
    tasks: 'Görev',
    'important-contacts': 'Kişiler',
    stats: 'İstat.',
    'quick-actions': 'Hızlı',
  },
  widgetTitles: {
    inbox: 'Gelen kutusu',
    unread: 'Okunmamış',
    starred: 'Yıldızlı / önemli',
    calendar: 'Takvim / toplantılar',
    tasks: 'Görevler / hatırlatıcılar',
    'important-contacts': 'Önemli kişiler',
    stats: 'Mail istatistikleri',
    'quick-actions': 'Hızlı işlemler',
  },
  mock: {
    sampleSubject: 'Proje güncellemesi',
    samplePreview: 'Merhaba, ekteki taslağı inceleyebilir misiniz…',
    statDaily: 'Bugün: 42 ileti',
    statRatio: 'Okunan %68 · okunmayan %32',
    calendarWeekdays: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    calendarEventSeeds: [],
    calendarSpecialDaySeeds: [
      {
        month: 0,
        day: 1,
        title: 'Yılbaşı',
        description: 'Gregoryen takvimine göre yeni yılın ilk günü; resmi tatil.',
      },
      {
        month: 3,
        day: 23,
        title: '23 Nisan Ulusal Egemenlik ve Çocuk Bayramı',
        description: 'Türkiye Büyük Millet Meclisi’nin açılışının yıldönümü; çocuklara armağan edilmiş ulusal bayram.',
      },
      {
        month: 4,
        day: 1,
        title: 'Emek ve Dayanışma Günü',
        description: 'Uluslararası İşçi Bayramı.',
      },
      {
        month: 4,
        day: 19,
        title: '19 Mayıs Atatürk’ü Anma, Gençlik ve Spor Bayramı',
        description:
          'Mustafa Kemal Atatürk’ün Samsun’a çıkışının ve milli mücadelenin başlangıcının yıldönümü; resmi tatil ve gençlik bayramı.',
      },
      {
        month: 7,
        day: 30,
        title: '30 Ağustos Zafer Bayramı',
        description:
          'Büyük Taarruz’un ardından 30 Ağustos 1922’de kazanılan askeri zaferin ve bağımsızlığın kutlandığı ulusal bayram; resmi tatil.',
      },
      {
        month: 9,
        day: 29,
        title: 'Cumhuriyet Bayramı',
        description: 'Türkiye Cumhuriyeti’nin ilan edilişinin yıldönümü.',
      },
      {
        month: 10,
        day: 10,
        title: '10 Kasım Atatürk’ü Anma Günü',
        description:
          'Mustafa Kemal Atatürk’ün vefatının yıldönümü; tüm yurtta saygı duruşu ve anma törenleriyle anılır.',
      },
    ],
    calendarNoEvents: 'Bu gün için etkinlik yok.',
    calendarPrevMonth: 'Önceki ay',
    calendarNextMonth: 'Sonraki ay',
    calendarClosePopover: 'Kapat',
    calendarSectionHoliday: 'Özel gün',
    calendarSectionEvents: 'Etkinlikler',
    taskLine1: 'Taslağı gözden geçir',
    taskLine2: 'Yanıtı gönder',
    taskDeadline: 'Yarın 17:00',
    quickNewMail: 'Yeni mail oluştur',
    quickFilter: 'Filtre uygula',
    quickSearch: 'Arama',
    inboxMockRows: [...repeatInboxMockRow(trInboxMockSeed, INBOX_MOCK_ROW_COUNT), trInboxHtmlDemoRow],
    spamMockRows: [],
    draftsMockRows: repeatDraftsMockRows(trDraftsMockSeeds, DRAFTS_MOCK_ROW_COUNT),
  },
};

const en: MailDashboardCopy = {
  pageTitle: 'Mailbox',
  navGeneralInbox: 'Inbox',
  mailSidebarTitle: 'Mail',
  activePanelTitle: "Widgets",
  activePanelHint: 'Click an icon: visible on the board when on, hidden when off.',
  resetLayout: 'Reset layout',
  resetConfirm:
    'Your custom layout will be cleared and restored to the default. Continue?',
  sidebarBrand: 'MailMind',
  navDashboard: 'Dashboard',
  navCalendar: 'Calendar',
  navStarred: 'Starred',
  navSpam: 'Spam',
  navSent: 'Sent',
  navDrafts: 'Drafts',
  navTrash: 'Trash',
  navNewMail: 'New mail',
  composeRegionAria: 'Compose new mail',
  composeTitle: 'New mail',
  composeToLabel: 'To',
  composeSubjectLabel: 'Subject',
  composeBodyLabel: 'Message',
  composeSend: 'Send',
  composeClose: 'Close',
  composeBackAria: 'Go back',
  composeMockHint: '',
  navHome: 'Home',
  navConnect: 'Connect account',
  navSearchPlaceholder: 'Search mail and people…',
  navProfile: 'Profile',
  navLogout: 'Sign out',
  calendarPageToday: 'Go to today',
  calendarPageSidebarEmpty: 'Select a day on the calendar to see events and holidays.',
  inboxAttachmentsLabel: 'Attachments',
  inboxBackToListAria: 'Back to list',
  inboxMessageReaderRegionAria: 'Message content',
  inboxReaderMessageActionsAria: 'Message actions',
  inboxSelectRowAria: 'Select message',
  inboxStarRowAria: 'Star',
  inboxToolbarAria: 'Inbox toolbar',
  sentToolbarAria: 'Sent mail toolbar',
  draftsToolbarAria: 'Drafts toolbar',
  trashToolbarAria: 'Trash toolbar',
  trashBulkPermanentDeleteAria: 'Delete permanently',
  trashBulkRestoreAria: 'Restore',
  draftsNoRecipientLabel: 'Draft',
  readerToPrefix: 'To:',
  readerAiSummaryLabel: 'AI Summary:',
  readerAiSummaryAria: 'AI-generated short summary',
  readerSpamNoAiSummaryText: 'This message contains spam; an AI summary is not generated.',
  readerSpamAiSummaryAria: 'Spam notice',
  inboxSelectAllAria: 'Select all messages',
  inboxSelectionMenuAria: 'Selection options',
  inboxRefreshAria: 'Refresh',
  inboxMoreActionsAria: 'More actions',
  inboxPagePrevAria: 'Previous page',
  inboxPageNextAria: 'Next page',
  inboxPageRangeTemplate: '{{start}}-{{end}}/{{total}}',
  inboxPageRangeEmpty: '0 messages',
  inboxBulkArchiveAria: 'Archive',
  inboxBulkDeleteAria: 'Delete',
  inboxBulkSpamAria: 'Report spam',
  inboxBulkMarkReadAria: 'Mark as read',
  inboxClearSelectionAria: 'Clear selection',
  inboxHtmlBadgeTitle: 'HTML5 body',
  spamBulkNotSpamLabel: 'Not spam',
  widgetPanelCollapse: 'Hide widget panel',
  widgetPanelExpand: 'Show widget panel',
  emptyDashboard: 'No widgets enabled. Turn on at least one in the right panel.',
  toggleStateOn: 'on',
  toggleStateOff: 'off',
  editModeLabel: 'Edit mode',
  editModeEnterHint: 'Turn on: move and resize widgets',
  editModeExitHint: 'Turn off: lock layout',
  widgetShortLabels: {
    inbox: 'Inbox',
    unread: 'Unread',
    starred: 'Star',
    calendar: 'Cal',
    tasks: 'Tasks',
    'important-contacts': 'People',
    stats: 'Stats',
    'quick-actions': 'Quick',
  },
  widgetTitles: {
    inbox: 'Inbox',
    unread: 'Unread',
    starred: 'Starred / important',
    calendar: 'Calendar / meetings',
    tasks: 'Tasks / reminders',
    'important-contacts': 'Important contacts',
    stats: 'Mail statistics',
    'quick-actions': 'Quick actions',
  },
  mock: {
    sampleSubject: 'Project update',
    samplePreview: 'Hi, could you review the draft attached…',
    statDaily: 'Today: 42 messages',
    statRatio: 'Read 68% · unread 32%',
    calendarWeekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    calendarEventSeeds: [],
    calendarSpecialDaySeeds: [
      {
        month: 0,
        day: 1,
        title: 'New Year’s Day',
        description: 'Public holiday in many countries.',
      },
      {
        month: 6,
        day: 4,
        title: 'Independence Day (US)',
        description: 'Federal holiday; mock example for the widget.',
      },
      {
        month: 4,
        day: 19,
        title: 'Commemoration of Atatürk, Youth and Sports Day',
        description:
          'Observed in Turkey on 19 May; marks the start of the national struggle and youth & sports celebrations.',
      },
      {
        month: 7,
        day: 30,
        title: 'Victory Day (Turkey)',
        description:
          'National holiday marking the decisive military victory of 30 August 1922 in the Turkish War of Independence.',
      },
      {
        month: 10,
        day: 10,
        title: 'Atatürk Memorial Day (Turkey)',
        description:
          'Day of remembrance for Mustafa Kemal Atatürk, observed nationwide on 10 November each year.',
      },
      {
        month: 11,
        day: 25,
        title: 'Christmas Day',
        description: 'Widely observed holiday.',
      },
    ],
    calendarNoEvents: 'No events for this day.',
    calendarPrevMonth: 'Previous month',
    calendarNextMonth: 'Next month',
    calendarClosePopover: 'Close',
    calendarSectionHoliday: 'Holiday',
    calendarSectionEvents: 'Events',
    taskLine1: 'Review draft',
    taskLine2: 'Send reply',
    taskDeadline: 'Tomorrow 5:00 PM',
    quickNewMail: 'New mail',
    quickFilter: 'Apply filter',
    quickSearch: 'Search',
    inboxMockRows: [...repeatInboxMockRow(enInboxMockSeed, INBOX_MOCK_ROW_COUNT), enInboxHtmlDemoRow],
    spamMockRows: [],
    draftsMockRows: repeatDraftsMockRows(enDraftsMockSeeds, DRAFTS_MOCK_ROW_COUNT),
  },
};

export const mailDashboardContent: Record<LanguageMode, MailDashboardCopy> = {
  tr,
  en,
};
