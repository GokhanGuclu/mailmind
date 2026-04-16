import { Module } from '@nestjs/common';
import { AiAnalysisController } from './presentation/ai-analysis.controller';
import { EmailAnalyzerService } from './application/email-analyzer.service';
import { AiWorkerService } from './application/ai-worker.service';
import { OllamaProvider } from './infrastructure/ollama/ollama.provider';
import { AiAnalysisRepository } from './infrastructure/persistence/ai-analysis.repository.prisma';
import { AI_PROVIDER_TOKEN } from './application/ports/ai-provider.port';

@Module({
  controllers: [AiAnalysisController],
  providers: [
    // Port → Implementation bağlantısı
    { provide: AI_PROVIDER_TOKEN, useClass: OllamaProvider },
    EmailAnalyzerService,
    AiWorkerService,
    AiAnalysisRepository,
  ],
  exports: [EmailAnalyzerService],
})
export class AiModule {}
