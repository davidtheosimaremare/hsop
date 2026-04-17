import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "vendor@hokiindo.com";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "VENDOR",
      isVerified: true,
      isActive: true,
      name: "Vendor Hokiindo Simulation",
    },
    create: {
      email,
      password: hashedPassword,
      role: "VENDOR",
      isVerified: true,
      isActive: true,
      name: "Vendor Hokiindo Simulation",
    },
  });

  console.log("Vendor user created/updated successfully:");
  console.log("Email: " + email);
  console.log("Password: " + password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
