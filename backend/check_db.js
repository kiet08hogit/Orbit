const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany();
  console.log('POSTS:', posts.length);
  const users = await prisma.user.findMany();
  console.log('USERS:', users.length);
}

main().finally(() => prisma.$disconnect());
