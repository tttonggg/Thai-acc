/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findFirst().then(u => {
  console.log('User:', u?.email, u?.role);
  p.$disconnect();
}).catch(e => {
  console.log('Error:', e.message);
  p.$disconnect();
});