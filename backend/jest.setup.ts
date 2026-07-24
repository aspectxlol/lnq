jest.mock('@prisma/adapter-pg', () => require('./src/test-utils/prisma-adapter.mock'));
jest.mock('@prisma/client', () => require('./src/test-utils/prisma-client.mock'));
