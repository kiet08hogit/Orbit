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
    
    // 2. Extract the token from the handshake auth object
    const token = client.handshake.auth?.token;

    if (!token) {
      // Notice we throw WsException here instead of UnauthorizedException!
      throw new WsException('Missing auth token in handshake');
    }

    try {
      // 3. Verify the token using Clerk
      const verifiedSession = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // 4. Fetch the user details to enforce UIC domain
      const clerkUser = await this.clerkClient.users.getUser(verifiedSession.sub);
      
      const primaryEmail = clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;

      if (!primaryEmail || !primaryEmail.endsWith('@uic.edu')) {
         throw new WsException('Only @uic.edu emails are allowed.');
      }

      // 5. Attach the user info directly to the Socket client object
      // This allows our ChatGateway to know exactly who is sending messages!
      client.user = {
        clerkUserId: clerkUser.id,
        email: primaryEmail,
      };

      return true;
    } catch (error) {
      throw new WsException('Invalid or expired token');
    }
  }
}
