import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Add your seed data here
  // Example:
  // const user = await prisma.user.create({
  //   data: {
  //     email: 'example@email.com',
  //     name: 'Example User',
  //   },
  // });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

