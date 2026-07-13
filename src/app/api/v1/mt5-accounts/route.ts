import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { encryptPassword } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { label, login, broker_name, server, investor_password } = await request.json();

    if (!label || !login || !broker_name || !server || !investor_password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const encrypted = encryptPassword(investor_password);

    const result = await prisma.$transaction(async (tx) => {
      let account = await tx.tradingAccount.findFirst({
        where: {
          userId: user.id,
          accountNumber: String(login),
          server: server,
        },
      });

      if (account) {
        account = await tx.tradingAccount.update({
          where: { id: account.id },
          data: {
            name: label,
            broker: broker_name,
            platform: "MetaTrader 5",
            syncSource: "WINDOWS_IMPORT",
          },
        });
      } else {
        account = await tx.tradingAccount.create({
          data: {
            userId: user.id,
            name: label,
            broker: broker_name,
            server: server,
            accountNumber: String(login),
            platform: "MetaTrader 5",
            syncSource: "WINDOWS_IMPORT",
            status: "UNVERIFIED",
          },
        });
      }

      await tx.tradingAccountCredential.upsert({
        where: { accountId: account.id },
        create: {
          accountId: account.id,
          encryptedPassword: encrypted,
          keyVersion: "v1",
        },
        update: {
          encryptedPassword: encrypted,
          keyVersion: "v1",
        },
      });

      return account;
    });

    return NextResponse.json({
      id: result.id,
      label: result.name,
      login_masked: "****" + login.substring(login.length - 4),
      server: result.server,
      status: result.status,
      has_credential: true,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to link MT5 account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
