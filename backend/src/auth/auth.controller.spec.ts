import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthController', () => {
  let controller: AuthController;

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

    controller = new AuthController(new AuthService(prisma));
  });

  it('registers a new local user', async () => {
    const result = await controller.register({
      username: 'bob',
      email: 'bob@example.com',
      password: 'secret',
    });

    expect(result.user.username).toBe('bob');
    expect(result.user.email).toBe('bob@example.com');
  });
});
