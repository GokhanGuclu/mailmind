import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AiProviderPort, EmailContent } from '../../application/ports/ai-provider.port';
import { AnalysisResult, TaskResult, CalendarEventResult } from '../../domain/value-objects/analysis-result.vo';
import { AiProviderError, AiResponseParseError } from '../../domain/errors/ai.errors';

const SYSTEM_PROMPT = `Sen bir e-posta asistanısın. Verilen e-postayı analiz et ve yapılandırılmış bilgi çıkar.

SADECE aşağıdaki formatta geçerli bir JSON nesnesiyle yanıt ver (markdown yok, açıklama yok):
{
  "summary": "E-posta içeriğinin 2-3 cümlelik kısa Türkçe özeti",
  "tasks": [
    {
      "title": "Eylem maddesi başlığı",
      "notes": "İsteğe bağlı ek bağlam veya null",
      "dueAt": "ISO 8601 tarih dizesi veya null",
      "priority": "LOW" veya "MEDIUM" veya "HIGH"
    }
  ],
  "calendarEvents": [
    {
      "title": "Etkinlik veya toplantı başlığı",
      "startAt": "ISO 8601 tarih dizesi",
      "endAt": "ISO 8601 tarih dizesi veya null",
      "location": "Konum dizesi veya null",
      "attendees": ["email@example.com"]
    }
  ]
}

Kurallar:
- tasks: yalnızca takip gerektiren gerçek eylem maddeleri. Yoksa boş dizi.
- calendarEvents: yalnızca net tarih/saati olan etkinlikler. Yoksa boş dizi.
- summary: HER ZAMAN Türkçe yaz, e-postanın dilinden bağımsız olarak.
- SADECE JSON nesnesiyle yanıt ver. Önce veya sonra ekstra metin olmadan.`;

@Injectable()
export class OllamaProvider implements AiProviderPort {
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly client: OpenAI;
  readonly modelName: string;

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
      apiKey: 'ollama', // Ollama'da gerekli ama kullanılmıyor
    });
    this.modelName = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b-instruct';
  }

  async analyzeEmail(content: EmailContent): Promise<AnalysisResult> {
    const userMessage = this.buildUserMessage(content);

    let raw: string;
    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1, // düşük sıcaklık = tutarlı yapılandırılmış çıktı
      });
      raw = response.choices[0]?.message?.content ?? '';
    } catch (err: any) {
      throw new AiProviderError(`Ollama request failed: ${err?.message}`, err);
    }

    return this.parseResponse(raw);
  }

  // ---------------------------------------------------------------------------

  private buildUserMessage(content: EmailContent): string {
    return [
      `Date: ${content.date.toISOString()}`,
      `From: ${content.from}`,
      `Subject: ${content.subject}`,
      ``,
      `Body:`,
      content.bodyText || '(empty)',
    ].join('\n');
  }

  private parseResponse(raw: string): AnalysisResult {
    // Model bazen JSON'u markdown code block içine sarar, temizle
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // JSON bulunamadıysa, metinden çıkarmayı dene
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new AiResponseParseError(raw.slice(0, 500));
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new AiResponseParseError(raw.slice(0, 500));
      }
    }

    return {
      summary: String(parsed.summary ?? ''),
      tasks: this.parseTasks(parsed.tasks),
      calendarEvents: this.parseEvents(parsed.calendarEvents),
    };
  }

  private parseTasks(raw: unknown): TaskResult[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((t) => t?.title)
      .map((t) => ({
        title: String(t.title).slice(0, 500),
        notes: t.notes ? String(t.notes) : undefined,
        dueAt: t.dueAt ? this.safeDate(t.dueAt) : null,
        priority: this.parsePriority(t.priority),
      }));
  }

  private parseEvents(raw: unknown): CalendarEventResult[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((e) => e?.title && e?.startAt)
      .map((e) => ({
        title: String(e.title).slice(0, 500),
        startAt: this.safeDate(e.startAt) ?? new Date(),
        endAt: e.endAt ? this.safeDate(e.endAt) : null,
        location: e.location ? String(e.location) : null,
        attendees: Array.isArray(e.attendees)
          ? e.attendees.map(String).filter(Boolean)
          : [],
      }))
      .filter((e) => e.startAt !== null);
  }

  private parsePriority(raw: unknown): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (raw === 'LOW' || raw === 'MEDIUM' || raw === 'HIGH') return raw;
    return 'MEDIUM';
  }

  private safeDate(raw: unknown): Date | null {
    if (!raw) return null;
    const d = new Date(String(raw));
    return isNaN(d.getTime()) ? null : d;
  }
}
