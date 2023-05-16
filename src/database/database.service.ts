import { PrismaClient } from '@prisma/client';

export type DatabaseService = PrismaClient;

export const databaseService = new PrismaClient();
