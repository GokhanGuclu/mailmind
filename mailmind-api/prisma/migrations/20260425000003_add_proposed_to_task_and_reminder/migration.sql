-- TaskStatus ve ReminderStatus enum'larına PROPOSED değerini ekle.
-- Bu migration default değiştirmediği için Postgres enum-default kısıtlaması burada yok;
-- AI tarafı status'u kayıt anında explicit olarak 'PROPOSED' verecek (kullanıcı manuel
-- create'de mevcut PENDING/ACTIVE default'u korunur).
ALTER TYPE "TaskStatus" ADD VALUE 'PROPOSED' BEFORE 'PENDING';
ALTER TYPE "ReminderStatus" ADD VALUE 'PROPOSED' BEFORE 'ACTIVE';
