const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany();
  console.log("Total posts:", posts.length);
  const ids = posts.map(p => p.id);
  const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
  console.log("Duplicate IDs:", duplicates);
}

main().finally(() => prisma.$disconnect());
