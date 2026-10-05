import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 menggunakan driver adapter. Untuk MySQL 8 (Laragon) adapter resmi
 * adalah `@prisma/adapter-mariadb` yang berjalan di atas `mysql2`.
 *
 * Prisma Client harus diinstansikan SATU KALI per proses. Pada Next.js dev
 * (hot reload) instance akan dibuat ulang, sehingga disimpan di globalThis
 * agar koneksi tidak bocor (connection leak).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum diset. Salin .env.example ke .env lalu isi nilainya.",
    );
  }

  const adapter = new PrismaMariaDb(connectionString);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export { Prisma };
export default db;
