export type AiAnalysisStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export type AiAnalysisProps = {
  id: string;
  userId: string;
  mailboxMessageId: string;
  status: AiAnalysisStatus;
  model: string | null;
  summary: string | null;
  rawResult: unknown | null;
  errorMessage: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class AiAnalysisEntity {
  private constructor(private readonly props: AiAnalysisProps) {}

  static rehydrate(props: AiAnalysisProps): AiAnalysisEntity {
    return new AiAnalysisEntity(props);
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get mailboxMessageId() { return this.props.mailboxMessageId; }
  get status() { return this.props.status; }
  get summary() { return this.props.summary; }
  get isPending() { return this.props.status === 'PENDING'; }
  get isDone() { return this.props.status === 'DONE'; }
  get isFailed() { return this.props.status === 'FAILED'; }
}
