import { Controller, Post, Req, Headers, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { Webhook } from 'svix';
import { UsersService } from '../users/users.service';
import { createClerkClient } from '@clerk/backend';

@Controller('webhooks')
export class WebhooksController {
    private clerkClient;

    constructor(private readonly usersService: UsersService) {
        this.clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    }

    @Post('clerk')
    async handleClerkWebhook(@Req() req: RawBodyRequest<Request>, @Headers() headers: any) {
        const payload = req.rawBody?.toString('utf8');
        if (!payload) {
            throw new BadRequestException('Missing raw body');
        }

        const svixHeaders = {
            'svix-id': headers['svix-id'],
            'svix-timestamp': headers['svix-timestamp'],
            'svix-signature': headers['svix-signature'],
        };

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
        let evt: any;

        try {
            evt = wh.verify(payload, svixHeaders);
        } catch (err) {
            console.error('[Webhook Error] Invalid signature', err);
            throw new BadRequestException('Invalid webhook signature');
        }

        const eventType = evt.type;

        // Auto-delete non-university signups
        if (eventType === 'user.created') {
            const { id, email_addresses, primary_email_address_id } = evt.data;
            const primaryEmailObj = email_addresses?.find(
                (email: any) => email.id === primary_email_address_id
            );
            const email = primaryEmailObj?.email_address;

            if (!email || !email.endsWith('.edu')) {
                console.log(`[Webhook] Restricting non-edu signup: ${email}. Deleting user ${id}...`);
                try {
                    await this.clerkClient.users.deleteUser(id);
                    console.log(`[Webhook] Successfully deleted non-edu user: ${id}`);
                } catch (err) {
                    console.error(`[Webhook] Failed to delete non-edu user: ${id}`, err);
                }
                return { success: true, message: 'Deleted non-edu user' };
            }
        }

        // Sync Clerk deletion to Postgres
        if (eventType === 'user.deleted') {
            const { id } = evt.data;
            try {
                await this.usersService.deleteUserByClerkId(id);
                console.log(`[Webhook] User deleted: ${id}`);
            } catch (err: any) {
                // If user doesn't exist in our db yet, that's totally fine. Ignore P2025.
                if (err.code !== 'P2025') {
                    throw err;
                }
            }
        }

        return { success: true };
    }
}
