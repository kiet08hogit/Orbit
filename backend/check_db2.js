const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany();
  console.log('--- DB POSTS ---');
  console.log(posts);
  const users = await prisma.user.findMany();
  console.log('--- DB USERS ---');
  console.log(users);
}

main().finally(() => prisma.$disconnect());
