import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['error', 'warn'],
      datasourceUrl: process.env.DATABASE_URL,
    });
  }
  
  async onModuleInit() {
    await this.$connect();
    console.log('Database connection established');
  }
  
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Database connection closed');
  }
}
