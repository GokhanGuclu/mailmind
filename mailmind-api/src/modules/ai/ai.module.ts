import { Module } from '@nestjs/common';
import { AiAnalysisController } from './presentation/ai-analysis.controller';
import { AiComposeController } from './presentation/ai-compose.controller';
import { EmailAnalyzerService } from './application/email-analyzer.service';
import { AiWorkerService } from './application/ai-worker.service';
import { AiComposeService } from './application/ai-compose.service';
import { RecurrenceDetectorService } from './application/recurrence-detector.service';
import { OllamaProvider } from './infrastructure/ollama/ollama.provider';
import { AiAnalysisRepository } from './infrastructure/persistence/ai-analysis.repository.prisma';
import { AI_PROVIDER_TOKEN } from './application/ports/ai-provider.port';

@Module({
  controllers: [AiAnalysisController, AiComposeController],
  providers: [
    // Port → Implementation bağlantısı
    { provide: AI_PROVIDER_TOKEN, useClass: OllamaProvider },
    EmailAnalyzerService,
    AiWorkerService,
    AiComposeService,
    AiAnalysisRepository,
    RecurrenceDetectorService,
  ],
  exports: [EmailAnalyzerService, RecurrenceDetectorService],
})
export class AiModule {}
