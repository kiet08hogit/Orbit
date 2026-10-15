import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from './clerk-auth.guard';

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

function clerkUser(email: string) {
  return {
    id: 'user_123',
    primaryEmailAddressId: 'email_1',
    emailAddresses: [{ id: 'email_1', emailAddress: email }],
  };
}

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ClerkAuthGuard();
  });

  it('rejects a request with no Authorization header', async () => {
    const { context } = contextFor({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  it('rejects a non-Bearer Authorization header', async () => {
    const { context } = contextFor({ authorization: 'Basic abc123' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired token', async () => {
    mockVerifyToken.mockRejectedValue(new Error('jwt expired'));
    const { context } = contextFor({ authorization: 'Bearer bad' });
    await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired token');
  });

  it('does not accept the old "dev-token" backdoor', async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    mockVerifyToken.mockRejectedValue(new Error('invalid jwt'));
    const { context, request } = contextFor({ authorization: 'Bearer dev-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(mockVerifyToken).toHaveBeenCalledWith('dev-token', expect.anything());
    expect(request.user).toBeUndefined();
    process.env.NODE_ENV = previousEnv;
  });

  it('forbids users whose primary email is not .edu', async () => {
    mockVerifyToken.mockResolvedValue({ sub: 'user_123' });
    mockGetUser.mockResolvedValue(clerkUser('someone@gmail.com'));
    const { context, request } = contextFor({ authorization: 'Bearer good' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(request.user).toBeUndefined();
  });

  it('forbids users with no primary email', async () => {
    mockVerifyToken.mockResolvedValue({ sub: 'user_123' });
    mockGetUser.mockResolvedValue({ ...clerkUser('a@uni.edu'), primaryEmailAddressId: 'missing' });
    const { context } = contextFor({ authorization: 'Bearer good' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('allows .edu users and attaches them to the request', async () => {
    mockVerifyToken.mockResolvedValue({ sub: 'user_123' });
    mockGetUser.mockResolvedValue(clerkUser('student@uni.edu'));
    const { context, request } = contextFor({ authorization: 'Bearer good' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith('user_123');
    expect(request.user).toEqual({ clerkUserId: 'user_123', email: 'student@uni.edu' });
  });
});
