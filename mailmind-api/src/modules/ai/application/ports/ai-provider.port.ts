import { AnalysisResult } from '../../domain/value-objects/analysis-result.vo';

export type EmailContent = {
  subject: string;
  from: string;
  date: Date;
  bodyText: string; // truncated

  /** IANA timezone (örn "Europe/Istanbul") — LLM'in göreceli tarihleri çözmesi için */
  userTimezone: string;

  /** "Şu anki zaman" — LLM'in "yarın", "Pazartesi" gibi ifadeleri çözmesi için */
  nowIso: string;
};

export interface AiProviderPort {
  analyzeEmail(content: EmailContent): Promise<AnalysisResult>;
  readonly modelName: string;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';
