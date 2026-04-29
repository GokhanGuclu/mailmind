-- CalendarEvent.isAllDay: saat belirsiz (mailde sadece tarih var) durumlar için.
-- AI saat çıkaramazsa isAllDay=true ve startAt o günün 00:00'ı; UI bunu
-- "Tüm gün" olarak gösterir, kullanıcı edit ile saat eklerse false yapılır.
ALTER TABLE "CalendarEvent" ADD COLUMN "isAllDay" BOOLEAN NOT NULL DEFAULT false;
