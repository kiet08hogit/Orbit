import { BadRequestException } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';

const mockVerify = jest.fn();
jest.mock('svix', () => ({
  Webhook: jest.fn().mockImplementation(() => ({ verify: mockVerify })),
}));

const mockDeleteUser = jest.fn();
jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(() => ({ users: { deleteUser: mockDeleteUser } })),
}));

const svixHeaders = {
  'svix-id': 'msg_1',
  'svix-timestamp': '1700000000',
  'svix-signature': 'v1,signature',
};

function request(body?: object) {
  return { rawBody: body ? Buffer.from(JSON.stringify(body)) : undefined } as any;
}

function userCreated(email: string | null) {
  return {
    type: 'user.created',
    data: {
      id: 'user_123',
      primary_email_address_id: 'email_1',
      email_addresses: email ? [{ id: 'email_1', email_address: email }] : [],
    },
  };
}

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let usersService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    usersService = { deleteUserByClerkId: jest.fn() };
    controller = new WebhooksController(usersService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('rejects a request with no raw body', async () => {
    await expect(controller.handleClerkWebhook(request(), svixHeaders))
      .rejects.toThrow('Missing raw body');
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('rejects a request with missing svix headers', async () => {
    mockVerify.mockImplementation(() => { throw new Error('Missing required headers'); });
    await expect(controller.handleClerkWebhook(request({ type: 'user.created' }), {}))
      .rejects.toThrow(BadRequestException);
    expect(mockVerify).toHaveBeenCalledWith(expect.any(String), {
      'svix-id': undefined,
      'svix-timestamp': undefined,
      'svix-signature': undefined,
    });
  });

  it('rejects a bad signature', async () => {
    mockVerify.mockImplementation(() => { throw new Error('No matching signature found'); });
    await expect(controller.handleClerkWebhook(request({ type: 'user.created' }), svixHeaders))
      .rejects.toThrow('Invalid webhook signature');
    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(usersService.deleteUserByClerkId).not.toHaveBeenCalled();
  });

  it('verifies the exact raw payload with the svix headers', async () => {
    const body = { type: 'session.created', data: {} };
    mockVerify.mockReturnValue(body);
    await controller.handleClerkWebhook(request(body), { ...svixHeaders, other: 'x' });
    expect(mockVerify).toHaveBeenCalledWith(JSON.stringify(body), svixHeaders);
  });

  it.each(['someone@gmail.com', null])('deletes a non-.edu signup (%p) from Clerk', async (email) => {
    mockVerify.mockReturnValue(userCreated(email));
    await expect(controller.handleClerkWebhook(request({}), svixHeaders))
      .resolves.toEqual({ success: true, message: 'Deleted non-edu user' });
    expect(mockDeleteUser).toHaveBeenCalledWith('user_123');
  });

  it('still acknowledges the webhook when the Clerk delete fails', async () => {
    mockVerify.mockReturnValue(userCreated('someone@gmail.com'));
    mockDeleteUser.mockRejectedValue(new Error('clerk down'));
    await expect(controller.handleClerkWebhook(request({}), svixHeaders))
      .resolves.toEqual({ success: true, message: 'Deleted non-edu user' });
  });

  it('keeps a .edu signup', async () => {
    mockVerify.mockReturnValue(userCreated('student@uni.edu'));
    await expect(controller.handleClerkWebhook(request({}), svixHeaders))
      .resolves.toEqual({ success: true });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('acknowledges user.updated without side effects', async () => {
    mockVerify.mockReturnValue({ type: 'user.updated', data: { id: 'user_123' } });
    await expect(controller.handleClerkWebhook(request({}), svixHeaders))
      .resolves.toEqual({ success: true });
    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(usersService.deleteUserByClerkId).not.toHaveBeenCalled();
  });

  it('deletes the local user on user.deleted', async () => {
    mockVerify.mockReturnValue({ type: 'user.deleted', data: { id: 'user_123' } });
    await expect(controller.handleClerkWebhook(request({}), svixHeaders))
      .resolves.toEqual({ success: true });
    expect(usersService.deleteUserByClerkId).toHaveBeenCalledWith('user_123');
  });

  it('ignores user.deleted for users that were never synced (P2025)', async () => {
    mockVerify.mockReturnValue({ type: 'user.deleted', data: { id: 'user_123' } });
    usersService.deleteUserByClerkId.mockRejectedValue({ code: 'P2025' });
    await expect(controller.handleClerkWebhook(request({}), svixHeaders))
      .resolves.toEqual({ success: true });
  });

  it('surfaces other database errors on user.deleted', async () => {
    mockVerify.mockReturnValue({ type: 'user.deleted', data: { id: 'user_123' } });
    usersService.deleteUserByClerkId.mockRejectedValue({ code: 'P1001' });
    await expect(controller.handleClerkWebhook(request({}), svixHeaders))
      .rejects.toEqual({ code: 'P1001' });
  });
});
