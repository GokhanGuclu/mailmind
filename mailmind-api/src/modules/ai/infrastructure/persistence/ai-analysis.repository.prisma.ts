import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

@Injectable()
export class AiAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string, limit = 50) {
    return this.prisma.aiAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        summary: true,
        model: true,
        processedAt: true,
        createdAt: true,
        mailboxMessageId: true,
        message: {
          select: { subject: true, from: true, date: true, folder: true },
        },
      },
    });
  }

  async findOneByUser(userId: string, analysisId: string) {
    return this.prisma.aiAnalysis.findFirst({
      where: { id: analysisId, userId },
      include: {
        message: {
          select: { subject: true, from: true, date: true, folder: true },
        },
        tasks: true,
        calendarEvents: true,
      },
    });
  }
}
