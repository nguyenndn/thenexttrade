
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Append connection pool params for Supabase Free plan (max 3 connections)
function getDatabaseUrl() {
 const url = process.env.DATABASE_URL || "";
 if (url.includes("supabase") && !url.includes("connection_limit")) {
 const separator = url.includes("?") ? "&" : "?";
 return `${url}${separator}connection_limit=3&pool_timeout=30`;
 }
 return url;
}

export const prisma =
 globalForPrisma.prisma ||
 new PrismaClient({
 datasourceUrl: getDatabaseUrl(),
 });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
