import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Products
  const products = [
    {
      title: "Mechanical Keyboard",
      description: "High-quality mechanical keyboard with RGB backlighting",
      price: 120.0,
      quantity: 50,
      image: "https://example.com/keyboard.jpg",
    },
    {
      title: "Gaming Mouse",
      description: "Precision gaming mouse with customizable DPI",
      price: 79.99,
      quantity: 75,
      image: "https://example.com/mouse.jpg",
    },
    {
      title: "Wireless Headphones",
      description: "Premium wireless headphones with noise cancellation",
      price: 199.99,
      quantity: 30,
      image: "https://example.com/headphones.jpg",
    },
    {
      title: "USB-C Hub",
      description: "Multi-port USB-C hub with HDMI and SD card reader",
      price: 49.99,
      quantity: 100,
      image: "https://example.com/hub.jpg",
    },
    {
      title: "Laptop Stand",
      description: "Ergonomic aluminum laptop stand",
      price: 59.99,
      quantity: 60,
      image: "https://example.com/stand.jpg",
    },
    {
      title: "Webcam HD",
      description: "1080p HD webcam with autofocus",
      price: 89.99,
      quantity: 40,
      image: "https://example.com/webcam.jpg",
    },
    {
      title: "Monitor Stand",
      description: "Adjustable monitor stand with cable management",
      price: 69.99,
      quantity: 45,
      image: "https://example.com/monitor-stand.jpg",
    },
    {
      title: "Desk Mat",
      description: "Large desk mat with ergonomic wrist support",
      price: 34.99,
      quantity: 80,
      image: "https://example.com/desk-mat.jpg",
    },
  ];

  console.log("Creating products...");
  
  // Clear existing products (if table exists)
  try {
    await prisma.product.deleteMany({});
    console.log("Cleared existing products...");
  } catch (error: any) {
    if (error.code === "P2021") {
      console.log("Product table does not exist yet. Please run migrations first.");
      throw new Error("Database tables not found. Please run: npm run prisma:migrate");
    }
    throw error;
  }
  
  // Create products
  await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  console.log(`${products.length} products created!`);
  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

