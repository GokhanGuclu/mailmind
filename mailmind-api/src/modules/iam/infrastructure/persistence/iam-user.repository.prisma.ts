import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class IamUserRepositoryPrisma {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.iamUser.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.iamUser.findUnique({ where: { id } });
  }

  create(data: { email: string; passwordHash: string }) {
    return this.prisma.iamUser.create({ data });
  }

  createTx(tx: Prisma.TransactionClient, data: { email: string; passwordHash: string }) {
    return tx.iamUser.create({ data });
  }
}