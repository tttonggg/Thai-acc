/**
 * Integration Test Setup
 */

import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  console.log('Setting up integration tests...');
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
  console.log('Integration tests complete.');
});
