import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // This function finds a user, or creates one if they don't exist yet!
    async syncUser(clerkUserId: string, email: string) {
        let user = await this.prisma.user.findFirst({
            where: { 
                OR: [
                    { clerkUserId },
                    { email }
                ]
            },
        });

        let defaultUniversity = null;
        if (email.endsWith('@uic.edu')) defaultUniversity = 'University of Illinois Chicago';
        else if (email.endsWith('@illinois.edu')) defaultUniversity = 'University of Illinois Urbana-Champaign';
        else if (email.endsWith('@depaul.edu')) defaultUniversity = 'DePaul University';
        else if (email.endsWith('.edu')) defaultUniversity = email.split('@')[1];

        if (!user) {
            user = await this.prisma.user.create({
                data: { clerkUserId, email, university: defaultUniversity },
            });
        } else {
            let updateData: any = {};
            if (user.clerkUserId !== clerkUserId) {
                updateData.clerkUserId = clerkUserId;
            }
            if (!user.university && defaultUniversity) {
                updateData.university = defaultUniversity;
            }
            
            if (Object.keys(updateData).length > 0) {
                user = await this.prisma.user.update({
                    where: { email },
                    data: updateData,
                });
            }
        }

        return user;
    }
    async getUserById(id: string) {
        return this.prisma.user.findFirst({ 
            where: { 
                OR: [
                    { id: id },
                    { clerkUserId: id }
                ]
            },
            include: {
                listings: {
                    where: { status: 'ACTIVE' },
                    include: { images: true }
                },
                _count: {
                    select: { listings: true }
                }
            }
        });
    }

    async updateUser(clerkUserId: string, updateData: any) {
        return this.prisma.user.update({
            where: { clerkUserId },
            data: updateData,
        });
    }

    async deleteUserByClerkId(clerkUserId: string) {
        return this.prisma.user.delete({
            where: { clerkUserId },
        });
    }
}
