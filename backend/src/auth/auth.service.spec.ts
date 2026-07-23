import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    const users: Array<Record<string, unknown>> = [];
    const prisma = {
      user: {
        findFirst: jest.fn(async (args?: any) => {
          const where = args?.where ?? {};
          return users.find((user) => {
            if (where.username && user.username !== where.username) {
              return false;
            }
            if (where.email && user.email !== where.email) {
              return false;
            }
            if (where.googleId && user.googleId !== where.googleId) {
              return false;
            }
            return true;
          });
        }),
        create: jest.fn(async (args?: any) => {
          const user = {
            id: `user-${users.length + 1}`,
            ...args?.data,
          };
          users.push(user);
          return user;
        }),
        update: jest.fn(async (args?: any) => {
          const index = users.findIndex((user) => user.id === args?.where?.id);
          if (index >= 0) {
            users[index] = { ...users[index], ...args?.data };
            return users[index];
          }
          return null;
        }),
      },
    } as unknown as PrismaService;

    service = new AuthService(prisma);
  });

  it('registers a local user and allows login by username or email', async () => {
    const user = await service.registerLocal({
      username: 'alice',
      email: 'alice@example.com',
      password: 'secret',
    });

    expect(user.username).toBe('alice');
    expect(user.email).toBe('alice@example.com');

    const byUsername = await service.validateLocalUser('alice', 'secret');
    const byEmail = await service.validateLocalUser(
      'alice@example.com',
      'secret',
    );

    expect(byUsername?.email).toBe('alice@example.com');
    expect(byEmail?.username).toBe('alice');
  });

  it('creates or reuses a Google-authenticated user', async () => {
    const user = await service.handleGoogleAuth({
      id: 'google-123',
      displayName: 'Google User',
      emails: [{ value: 'google@example.com' }],
    });

    expect(user.provider).toBe('google');
    expect(user.email).toBe('google@example.com');
  });
});
