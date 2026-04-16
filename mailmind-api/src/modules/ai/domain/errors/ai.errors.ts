export class AiProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export class AiResponseParseError extends Error {
  constructor(public readonly raw: string) {
    super('Failed to parse AI response as valid JSON');
    this.name = 'AiResponseParseError';
  }
}

export class AiAnalysisNotFoundError extends Error {
  constructor(id: string) {
    super(`AiAnalysis not found: ${id}`);
    this.name = 'AiAnalysisNotFoundError';
  }
}
