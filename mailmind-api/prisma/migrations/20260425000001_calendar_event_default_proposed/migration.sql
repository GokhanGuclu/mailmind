-- CalendarEvent.status default değerini PROPOSED'a çek.
-- Önceki migration'da PROPOSED enum değeri eklendi; bu ayrı migration olmak
-- zorunda çünkü Postgres yeni enum değerini aynı tx içinde DEFAULT yapmıyor.
ALTER TABLE "CalendarEvent" ALTER COLUMN "status" SET DEFAULT 'PROPOSED';
