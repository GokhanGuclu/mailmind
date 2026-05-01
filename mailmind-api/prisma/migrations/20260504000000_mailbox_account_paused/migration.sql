-- Kullanıcı bozuk/yorgun bir mailbox'ı manuel olarak duraklatabilsin diye
-- yeni status değeri. Sync worker `status='ACTIVE'` filtresi nedeniyle PAUSED
-- hesaplar otomatik atlanır; UI üzerinden Resume ile ACTIVE'e döner.
ALTER TYPE "MailboxAccountStatus" ADD VALUE 'PAUSED';
