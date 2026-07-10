const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const posts = await prisma.post.findMany({ where: { imageUrls: { isEmpty: false } } });
  if(posts.length > 0) {
    console.log("Type:", typeof posts[0].imageUrls);
    console.log("IsArray:", Array.isArray(posts[0].imageUrls));
    console.log("Content:", JSON.stringify(posts[0].imageUrls));
  } else {
    console.log("No posts with images");
  }
}
main().finally(() => prisma.$disconnect());
