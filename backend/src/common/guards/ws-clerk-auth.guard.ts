import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsClerkAuthGuard implements CanActivate {
  private clerkClient;

  constructor() {
    this.clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get the Socket.io client from the context
    const client = context.switchToWs().getClient();

    // 2. If we already authenticated this socket connection, skip re-verification!
    //    This prevents token expiration from killing messages mid-session.
    if (client.user) {
      return true;
    }
    
    // 3. Extract the token from the handshake auth object
    const token = client.handshake.auth?.token;

    if (!token) {
      throw new WsException('Missing auth token in handshake');
    }

    try {
      // 4. Verify the token using Clerk
      const verifiedSession = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // 5. Fetch the user details to enforce UIC domain
      const clerkUser = await this.clerkClient.users.getUser(verifiedSession.sub);
      
      const primaryEmail = clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;

      if (!primaryEmail || !primaryEmail.endsWith('@uic.edu')) {
         throw new WsException('Only @uic.edu emails are allowed.');
      }

      // 6. Cache the user info on the socket client for the entire connection lifetime!
      //    Future events on this socket will hit the early return above.
      client.user = {
        clerkUserId: clerkUser.id,
        email: primaryEmail,
      };

      return true;
    } catch (error: any) {
      console.error('WS Auth failed:', error.message || error);
      throw new WsException('Invalid or expired token');
    }
  }
}

