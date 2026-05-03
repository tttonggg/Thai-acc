const { PrismaClient } = require('/app/node_modules/.prisma/client/default');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log(JSON.stringify(users));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
