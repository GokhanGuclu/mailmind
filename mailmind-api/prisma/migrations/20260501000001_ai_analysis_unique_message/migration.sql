-- AiAnalysis için mailboxMessageId üzerinde unique constraint.
--
-- Önce mevcut duplicate'ları temizle (en eski kaydı tut), sonra constraint ekle.
-- Bu olmadan unique index oluşturma "violates unique" hatası verirdi.

-- 1) Duplicate temizliği — aynı mailboxMessageId için en eski (ilk createdAt)
--    kaydı tut, diğerlerini sil. Cascade ile bağlı Task/CalendarEvent/Reminder
--    kayıtları da silinir, ama AI çıktıları zaten yenidense ve kullanıcı
--    onaylamadıysa kayıp kabul edilebilir.
DELETE FROM "AiAnalysis" a
USING "AiAnalysis" b
WHERE a."mailboxMessageId" = b."mailboxMessageId"
  AND a.id <> b.id
  AND a."createdAt" > b."createdAt";

-- 2) Eski (redundant) index'i düşür — @unique zaten index oluşturacak
DROP INDEX IF EXISTS "AiAnalysis_mailboxMessageId_idx";

-- 3) Unique constraint
CREATE UNIQUE INDEX "AiAnalysis_mailboxMessageId_key" ON "AiAnalysis"("mailboxMessageId");
