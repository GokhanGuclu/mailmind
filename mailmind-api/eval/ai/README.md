# MailMind AI Eval

Mevcut LLM kurulumunun (Ollama + qwen2.5:7b-instruct varsayılan) e-posta analiz başarısını gerçek istek atarak ölçen offline değerlendirme aracı.

## Çalıştırma

Ön koşul: Ollama açık ve modeli pull edilmiş olmalı.

```powershell
cd mailmind-api
npm run ai:eval
```

Çıktı örneği:

```
=== MailMind AI Eval ===
Model:     qwen2.5:7b-instruct
Base URL:  http://localhost:11434/v1
Fixtures:  8

✓  [001-recurring-weekly-meeting-tr.json]  Recurring weekly Monday standup (TR)  (3214ms)
✗  [004-marketing-skip.json]  Marketing newsletter — should skip  (2890ms)
     - calendarEvents: count=1, expected 0..0
     actual: tasks=0 events=1 reminders=0
...

=== Summary ===
Pass rate:     6/8 (75.0%)
JSON parse ok: 8/8
Latency p50:   3050ms
Latency p95:   4400ms
```

## Yeni fixture eklemek

`eval/ai/fixtures/` altına `NNN-name.json` formatında dosya oluştur. Şema:

```jsonc
{
  "name": "İnsan-okunur kısa açıklama",
  "input": {
    "subject": "...",
    "from": "...",
    "date": "ISO 8601",
    "bodyText": "...",
    "userTimezone": "Europe/Istanbul",
    "nowIso": "ISO 8601"
  },
  "expected": {
    "tasks": { "min": 0, "max": 1 },
    "calendarEvents": { "min": 1, "max": 1 },
    "reminders": { "min": 0, "max": 0 },
    "calendarEvent": {
      "titleContains": ["toplant"],          // herhangi biri eşleşsin
      "rruleContains": ["FREQ=WEEKLY"],      // hepsi rrule'da olsun
      "rruleByday": "MO",                    // BYDAY token'ı içersin
      "rruleNull": false,                    // null değil olsun
      "locationContains": ["Oda A"]
    }
  }
}
```

`task` ve `reminder` için de aynı yapı (`titleContains`, `rruleContains`, `rruleNull`, `dueAtNotNull`).

## CI

Bu suite **CI'da koşmuyor** — Ollama gerektirir. Pure logic için `recurrence-detector.spec.ts` Jest suite'i CI'da çalışır.

Prompt değiştirdiğinde / model güncellediğinde **mutlaka** elle koş ve summary'i not et.
