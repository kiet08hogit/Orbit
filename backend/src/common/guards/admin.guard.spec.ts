import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { AdminGuard } from './admin.guard';

const mockGetUser = jest.fn();
jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
  createClerkClient: jest.fn(() => ({ users: { getUser: mockGetUser } })),
}));

const mockVerifyToken = verifyToken as jest.Mock;

function contextFor(headers: Record<string, string>) {
  const request: any = { headers };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = { user: { findUnique: jest.fn() } };
    guard = new AdminGuard(prisma);
    mockVerifyToken.mockResolvedValue({ sub: 'user_123' });
    mockGetUser.mockResolvedValue({
      id: 'user_123',
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'admin@uni.edu' }],
    });
  });

  it('rejects unauthenticated requests before checking the role', async () => {
    const { context } = contextFor({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('forbids authenticated users without the ADMIN role', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
    const { context } = contextFor({ authorization: 'Bearer good' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { clerkUserId: 'user_123' },
      select: { role: true },
    });
  });

  it('forbids users missing from the database', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const { context } = contextFor({ authorization: 'Bearer good' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('allows admins', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    const { context } = contextFor({ authorization: 'Bearer good' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
