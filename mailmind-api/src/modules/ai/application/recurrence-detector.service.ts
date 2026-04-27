import { Injectable, Logger } from '@nestjs/common';
import { RRule } from 'rrule';

export type RruleValidation =
  | { ok: true; rule: RRule; nextFireAt: Date | null }
  | { ok: false; error: string };

/**
 * LLM'in ürettiği RRULE stringlerini doğrular ve sonraki tetikleme zamanını
 * hesaplar. LLM halüsinasyonlarına (geçersiz RRULE) karşı tek savunma katmanı.
 */
@Injectable()
export class RecurrenceDetectorService {
  private readonly logger = new Logger(RecurrenceDetectorService.name);

  /**
   * RRULE stringini parse eder ve "RRULE:" prefix'i olsa da olmasa da kabul eder.
   * Ek olarak en az 1 occurrence üretip doğruluğunu kontrol eder.
   */
  validate(raw: string, dtstart: Date = new Date()): RruleValidation {
    if (!raw || typeof raw !== 'string') {
      return { ok: false, error: 'empty rrule' };
    }

    const cleaned = raw.trim().replace(/^RRULE:/i, '');

    // Defense-in-depth: rrule.js BYDAY 3-letter token'ları (MON/FRI/FRIDAY) sessizce
    // kabul ediyor ama RFC 5545 sadece 2-letter (MO/TU/WE/TH/FR/SA/SU) kabul eder.
    // Yanlış token DB'ye yazılırsa Google Calendar push'ta patlar; burada kesiyoruz.
    const bydayMatch = /BYDAY=([^;]+)/i.exec(cleaned);
    if (bydayMatch) {
      const bad = bydayMatch[1]
        .split(',')
        .map((t) => t.trim())
        .filter((t) => !/^[+-]?\d{0,2}(MO|TU|WE|TH|FR|SA|SU)$/i.test(t));
      if (bad.length > 0) {
        return {
          ok: false,
          error: `BYDAY contains non-RFC5545 tokens: ${bad.join(',')}. Use 2-letter codes (MO/TU/WE/TH/FR/SA/SU).`,
        };
      }
    }

    let rule: RRule;
    try {
      rule = RRule.fromString(`DTSTART:${this.toIcalUtc(dtstart)}\nRRULE:${cleaned}`);
    } catch (e: any) {
      return { ok: false, error: `parse failed: ${e?.message ?? String(e)}` };
    }

    let nextFireAt: Date | null;
    try {
      nextFireAt = rule.after(dtstart, true);
    } catch (e: any) {
      return { ok: false, error: `after() failed: ${e?.message ?? String(e)}` };
    }

    if (!nextFireAt) {
      return { ok: false, error: 'rule produces no future occurrences' };
    }

    return { ok: true, rule, nextFireAt };
  }

  /**
   * Mevcut bir RRULE için bir sonraki tetikleme zamanını döner.
   * Kuralın hiç occurrence'ı kalmamışsa null döner (tamamlandı).
   */
  computeNextFireAt(rrule: string, after: Date = new Date()): Date | null {
    const v = this.validate(rrule, after);
    if (!v.ok) {
      this.logger.warn(`Invalid rrule when computing next fire: ${v.error}`);
      return null;
    }
    return v.rule.after(after, false);
  }

  // ICAL UTC format: YYYYMMDDTHHMMSSZ
  private toIcalUtc(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  }
}
