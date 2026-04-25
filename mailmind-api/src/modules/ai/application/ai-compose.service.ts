import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';

import { ComposeEmailDto } from './dto/compose-email.dto';

export type ComposedEmail = {
  subject: string;
  bodyText: string;
  bodyHtml: string;
};

const SYSTEM_PROMPT_TR = `Sen profesyonel bir Türkçe e-posta yazarısın.
Kullanıcının serbest metin halindeki isteğini, düzgün, akıcı ve dilbilgisi açısından doğru bir e-postaya dönüştür.

Kurallar:
- HER ZAMAN Türkçe yaz.
- DOĞRUDAN konuya gir. Asla dolgu cümlelerle başlama.
- Aşağıdaki kalıpları KESİNLİKLE KULLANMA:
  * "saygılı bir şekilde belirtmek isterim ki"
  * "bilgilerinize sunarım"
  * "size bildirmek isterim ki"
  * "saygılarımla bildirmek isterim"
  * "nazik bir şekilde"
  * "tarafınıza bildirmek isterim"
- Nazik ama öz ol; süsleme, tekrar ve gereksiz nezaket kalıpları yasak.
- "Merhaba," veya "Sayın …," ile başla; "Saygılarımla," kapanışıyla bitir.
- İmza yerine "[Adınız]" yer tutucusu koy.
- Kullanıcı isim/alıcı verdiyse onu kullan.
- SADECE aşağıdaki JSON formatında yanıtla, başka hiçbir şey yazma:
{
  "subject": "Kısa ve net konu (maks 80 karakter)",
  "body": "Satır aralıklı düz metin e-posta gövdesi"
}

Örnek — KÖTÜ:
"Sayın X,\\n\\nSize saygılı bir şekilde bildirmek isterim ki, toplantı ertelendi."
Örnek — İYİ:
"Sayın X,\\n\\nYarınki toplantımız 27 Nisan'a ertelendi."`;

const SYSTEM_PROMPT_EN = `You are a professional email writer.
Convert the user's free-form request into a well-written, polite, grammatically correct email.

Rules:
- Write in English.
- Be polite but concise.
- Start with an appropriate greeting and end with a proper closing like "Best regards,".
- Do not invent a signature; use "[Your Name]" as a placeholder.
- Respond ONLY with valid JSON, nothing else:
{
  "subject": "Short and clear subject (max 80 chars)",
  "body": "Plain-text email body with line breaks"
}`;

@Injectable()
export class AiComposeService {
  private readonly logger = new Logger(AiComposeService.name);
  private readonly client: OpenAI;
  private readonly modelName: string;

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
      apiKey: 'ollama',
    });
    this.modelName = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b-instruct';
  }

  async compose(dto: ComposeEmailDto): Promise<ComposedEmail> {
    const language = dto.language ?? 'tr';
    const tone = dto.tone ?? 'neutral';
    const length = dto.length ?? 'normal';
    const system = language === 'tr' ? SYSTEM_PROMPT_TR : SYSTEM_PROMPT_EN;

    const toneLine =
      language === 'tr'
        ? `Ton: ${tone === 'formal' ? 'resmi' : tone === 'friendly' ? 'samimi' : 'nötr-profesyonel'}.`
        : `Tone: ${tone}.`;

    const lengthLineTr = {
      short: 'Uzunluk: KISA. En fazla 2 cümle gövde, tek paragraf. Selamlama ve kapanış kısa olsun.',
      normal: 'Uzunluk: NORMAL. 1-2 paragraf, toplam 3-5 cümle gövde.',
      long: 'Uzunluk: UZUN. 2-4 paragraf, bağlamı ve detayları içeren zengin bir e-posta.',
    };
    const lengthLineEn = {
      short: 'Length: SHORT. At most 2 sentences in the body, single paragraph.',
      normal: 'Length: NORMAL. 1-2 paragraphs, 3-5 sentences total in the body.',
      long: 'Length: LONG. 2-4 paragraphs, a rich email including context and details.',
    };
    const lengthLine = language === 'tr' ? lengthLineTr[length] : lengthLineEn[length];

    const user = `${toneLine}\n${lengthLine}\n\n${language === 'tr' ? 'Kullanıcının isteği' : "User's request"}:\n${dto.prompt.trim()}`;

    let raw: string;
    try {
      const res = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.4,
      });
      raw = res.choices[0]?.message?.content ?? '';
    } catch (err: any) {
      this.logger.error(`AI compose failed: ${err?.message}`, err?.stack);
      throw new ServiceUnavailableException(
        'AI servisi şu anda yanıt vermiyor. Lütfen tekrar deneyin.',
      );
    }

    const parsed = this.parseResponse(raw);
    const cleanedBody = this.scrubFillerPhrases(parsed.body);
    return {
      subject: parsed.subject,
      bodyText: cleanedBody,
      bodyHtml: this.toHtml(cleanedBody),
    };
  }

  /**
   * Model'in üretmesi muhtemel dolgu kalıplarını kibarca kırpar.
   * "Size saygılı bir şekilde bildirmek isterim ki, X" → "X"
   */
  private scrubFillerPhrases(text: string): string {
    const patterns: RegExp[] = [
      /\b(size\s+)?saygılı\s+bir\s+şekilde\s+(bildirmek|belirtmek|iletmek)\s+isterim\s+ki[,:]?\s*/gi,
      /\bsize\s+bildirmek\s+isterim\s+ki[,:]?\s*/gi,
      /\btarafınıza\s+(bildirmek|iletmek)\s+isterim\s+ki[,:]?\s*/gi,
      /\bnazik\s+bir\s+şekilde\s+(bildirmek|belirtmek)\s+isterim\s+ki[,:]?\s*/gi,
      /\bbilgilerinize\s+(saygılarımla\s+)?sunar(ım|ız)[.,]?\s*/gi,
      /\bsaygılarımla\s+bildirmek\s+isterim\s+ki[,:]?\s*/gi,
    ];

    let out = text;
    for (const re of patterns) out = out.replace(re, '');

    // Cümle başlarını büyük harfle düzelt: "x, Yarınki" → virgülden sonra ilk harfi büyük yapmaya gerek yok,
    // ama kaldırma sonrası "\n\n, " veya başta virgül kaldıysa temizle.
    out = out
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(^|\n)[ \t]*[,;.]\s*/g, '$1')
      .replace(/^\s+/, '');

    // Her paragrafın ilk harfini büyüt
    out = out
      .split(/\n{2,}/)
      .map((p) => {
        const trimmed = p.replace(/^[\s,;.]+/, '');
        if (!trimmed) return trimmed;
        return trimmed[0].toLocaleUpperCase('tr-TR') + trimmed.slice(1);
      })
      .join('\n\n');

    return out.trim();
  }

  private parseResponse(raw: string): { subject: string; body: string } {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const tryParse = (s: string): any => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    };

    let obj = tryParse(cleaned);
    if (!obj) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) obj = tryParse(match[0]);
    }

    const subject =
      typeof obj?.subject === 'string' && obj.subject.trim()
        ? obj.subject.trim().slice(0, 200)
        : '';
    const body =
      typeof obj?.body === 'string' && obj.body.trim()
        ? obj.body.trim()
        : cleaned; // son çare: ham çıktıyı döndür

    if (!body) {
      throw new ServiceUnavailableException('AI boş yanıt döndürdü.');
    }

    return { subject: subject || this.fallbackSubject(body), body };
  }

  private fallbackSubject(body: string): string {
    const firstLine = body.split(/\r?\n/).find((l) => l.trim());
    return (firstLine ?? '').slice(0, 80) || 'Konu yok';
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private toHtml(text: string): string {
    // Paragrafları boş satıra göre böl, satırları <br/> ile birleştir.
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    return paragraphs
      .map((p) => `<p>${this.escapeHtml(p).replace(/\r?\n/g, '<br/>')}</p>`)
      .join('');
  }
}
