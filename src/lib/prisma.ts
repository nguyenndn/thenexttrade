import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Append connection pool params for persistent Node.js / PgBouncer runtime.
//
// Every query in a render wave needs its own connection until it finishes, so
// an unset pool silently falls back to `2 × cores + 1` and long render waves
// queue behind it. Size it explicitly; override with PRISMA_CONNECTION_LIMIT.
// URLs that already carry `connection_limit`, or that point at a PgBouncer
// transaction-mode endpoint (`pgbouncer=true`, which multiplexes and expects a
// client pool of 1), are left untouched.
function getDatabaseUrl() {
    const url = process.env.DATABASE_URL || "";
    if (!url) return url;
    if (url.includes("connection_limit") || url.includes("pgbouncer=true")) {
        return url;
    }
    const limit = process.env.PRISMA_CONNECTION_LIMIT || "15";
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}connection_limit=${limit}&pool_timeout=30`;
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        datasourceUrl: getDatabaseUrl(),
    });

globalForPrisma.prisma = prisma;
