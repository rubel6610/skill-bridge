import "dotenv/config";
import pg from "pg";
const { Pool } = pg;
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({
  connectionString,
  ssl: true,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };
