import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { verifyToken, createClerkClient } from '@clerk/backend';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private clerkClient;

  constructor() {
    this.clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 1. Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const token = authHeader.split(' ')[1];

    // Development backdoor for Postman testing
    /*
    if (process.env.NODE_ENV !== 'production' && token === 'dev-token') {
      request.user = {
        clerkUserId: 'dev_user_12345',
        email: 'dev@uic.edu',
      };
      return true;
    }
    */

    try {
      // 2. Verify the token using Clerk
      const verifiedSession = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // 3. Get the user from Clerk to check their email
      const clerkUser = await this.clerkClient.users.getUser(verifiedSession.sub);
      const primaryEmail = clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;

      // 4. Enforce UIC domain
      if (!primaryEmail || !primaryEmail.endsWith('@uic.edu')) {
        throw new ForbiddenException('Only @uic.edu emails are allowed on Orbit.');
      }

      // 5. Attach user info to the request so controllers can use it
      request.user = {
        clerkUserId: clerkUser.id,
        email: primaryEmail,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
