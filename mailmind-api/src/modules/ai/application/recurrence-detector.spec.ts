import { RecurrenceDetectorService } from './recurrence-detector.service';

describe('RecurrenceDetectorService', () => {
  const svc = new RecurrenceDetectorService();
  const FIXED_NOW = new Date('2026-04-25T10:00:00Z'); // Saturday

  describe('validate()', () => {
    it('rejects empty / non-string', () => {
      expect(svc.validate('').ok).toBe(false);
      expect(svc.validate(null as any).ok).toBe(false);
      expect(svc.validate(undefined as any).ok).toBe(false);
      expect(svc.validate(123 as any).ok).toBe(false);
    });

    it('accepts FREQ=DAILY without RRULE: prefix', () => {
      const v = svc.validate('FREQ=DAILY', FIXED_NOW);
      expect(v.ok).toBe(true);
      if (v.ok) {
        expect(v.nextFireAt).toBeInstanceOf(Date);
      }
    });

    it('accepts FREQ=WEEKLY;BYDAY=MO and produces a Monday occurrence', () => {
      const v = svc.validate('FREQ=WEEKLY;BYDAY=MO', FIXED_NOW);
      expect(v.ok).toBe(true);
      if (v.ok && v.nextFireAt) {
        // 2026-04-27 is Monday
        expect(v.nextFireAt.getUTCDay()).toBe(1);
      }
    });

    it('strips RRULE: prefix if present', () => {
      const v = svc.validate('RRULE:FREQ=DAILY', FIXED_NOW);
      expect(v.ok).toBe(true);
    });

    it('rejects garbage', () => {
      expect(svc.validate('not a real rrule', FIXED_NOW).ok).toBe(false);
      expect(svc.validate('FREQ=NOPE', FIXED_NOW).ok).toBe(false);
    });

    it('rejects 3-letter BYDAY tokens (RFC 5545 = 2-letter only)', () => {
      // rrule.js silently accepts these but they break Google Calendar; we reject.
      expect(svc.validate('FREQ=WEEKLY;BYDAY=FRI', FIXED_NOW).ok).toBe(false);
      expect(svc.validate('FREQ=WEEKLY;BYDAY=MON,WED', FIXED_NOW).ok).toBe(false);
      expect(svc.validate('FREQ=WEEKLY;BYDAY=FRIDAY', FIXED_NOW).ok).toBe(false);
    });

    it('accepts 2-letter BYDAY with optional ordinal prefix', () => {
      expect(svc.validate('FREQ=WEEKLY;BYDAY=MO,FR', FIXED_NOW).ok).toBe(true);
      expect(svc.validate('FREQ=MONTHLY;BYDAY=1FR', FIXED_NOW).ok).toBe(true);
      expect(svc.validate('FREQ=MONTHLY;BYDAY=-1MO', FIXED_NOW).ok).toBe(true);
    });

    it('rejects rule that has no future occurrences (UNTIL in the past)', () => {
      const v = svc.validate('FREQ=DAILY;UNTIL=20200101T000000Z', FIXED_NOW);
      expect(v.ok).toBe(false);
    });
  });

  describe('computeNextFireAt()', () => {
    it('returns next Monday for weekly Monday rule', () => {
      const next = svc.computeNextFireAt('FREQ=WEEKLY;BYDAY=MO', FIXED_NOW);
      expect(next).not.toBeNull();
      expect(next!.getUTCDay()).toBe(1);
    });

    it('advances daily rule by ~24h', () => {
      const next = svc.computeNextFireAt('FREQ=DAILY', FIXED_NOW);
      expect(next).not.toBeNull();
      const diffH = (next!.getTime() - FIXED_NOW.getTime()) / 3600_000;
      expect(diffH).toBeGreaterThan(0);
      expect(diffH).toBeLessThanOrEqual(25);
    });

    it('returns null for invalid rule', () => {
      expect(svc.computeNextFireAt('garbage', FIXED_NOW)).toBeNull();
    });

    it('handles bi-weekly (INTERVAL=2)', () => {
      const next = svc.computeNextFireAt('FREQ=WEEKLY;INTERVAL=2', FIXED_NOW);
      expect(next).not.toBeNull();
      expect(next!.getTime()).toBeGreaterThan(FIXED_NOW.getTime());
    });

    it('handles monthly first Friday (BYDAY=1FR)', () => {
      const next = svc.computeNextFireAt('FREQ=MONTHLY;BYDAY=1FR', FIXED_NOW);
      expect(next).not.toBeNull();
      expect(next!.getUTCDay()).toBe(5); // Friday
    });
  });
});
