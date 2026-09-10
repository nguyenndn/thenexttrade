"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/auth-cache";

// ==========================================
// EA BROKER ACTIONS
// ==========================================

export async function getEABrokers() {
    try {
        await requireAdminAuth();
        const brokers = await prisma.eABroker.findMany({
            orderBy: { order: "asc" },
        });
        return { success: true, data: brokers };
    } catch (error) {
        console.error("Failed to fetch EA brokers:", error);
        return { success: false, error: "Failed to fetch brokers", data: [] };
    }
}

export async function getActiveEABrokers() {
    try {
        const brokers = await prisma.eABroker.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
        });
        return brokers;
    } catch (error) {
        console.error("Failed to fetch active EA brokers:", error);
        return [];
    }
}

export async function createEABroker(data: {
    name: string;
    slug: string;
    logo: string;
    affiliateUrl?: string;
    ibCode?: string | null;
    color?: string;
    isActive?: boolean;
    order?: number;
}) {
    try {
        await requireAdminAuth();
        const broker = await prisma.eABroker.create({
            data: {
                name: data.name,
                slug: data.slug.toUpperCase(),
                logo: data.logo,
                affiliateUrl: data.affiliateUrl || null,
                ibCode: data.ibCode || null,
                color: data.color || "#00C888",
                isActive: data.isActive ?? true,
                order: data.order ?? 0,
            },
        });

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/brokers");
        revalidatePath("/dashboard/trading-systems");
        return { success: true, data: broker };
    } catch (error: any) {
        console.error("Failed to create EA broker:", error);
        if (error?.code === "P2002") {
            return {
                success: false,
                error: "A broker with this slug already exists",
            };
        }
        return { success: false, error: "Failed to create broker" };
    }
}

export async function updateEABroker(
    id: string,
    data: {
        name?: string;
        slug?: string;
        logo?: string;
        affiliateUrl?: string | null;
        ibCode?: string | null;
        color?: string;
        isActive?: boolean;
        order?: number;
    }
) {
    try {
        await requireAdminAuth();
        const updateData: any = { ...data };
        if (data.slug) updateData.slug = data.slug.toUpperCase();

        const broker = await prisma.eABroker.update({
            where: { id },
            data: updateData,
        });

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/brokers");
        revalidatePath("/dashboard/trading-systems");
        return { success: true, data: broker };
    } catch (error: any) {
        console.error("Failed to update EA broker:", error);
        if (error?.code === "P2002") {
            return {
                success: false,
                error: "A broker with this slug already exists",
            };
        }
        return { success: false, error: "Failed to update broker" };
    }
}

export async function deleteEABroker(id: string) {
    try {
        await requireAdminAuth();
        await prisma.eABroker.delete({ where: { id } });

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/brokers");
        revalidatePath("/dashboard/trading-systems");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete EA broker:", error);
        return { success: false, error: "Failed to delete broker" };
    }
}

// ==========================================
// BROKER COMMISSION RATE ACTIONS (Doc #3 Step 1 & 4)
// ==========================================

export async function getBrokerCommissionRates() {
    try {
        await requireAdminAuth();
        const rates = await prisma.brokerCommissionRate.findMany({
            include: {
                broker: {
                    select: { id: true, name: true, slug: true, color: true, logo: true },
                },
            },
            orderBy: [{ broker: { name: "asc" } }, { symbol: "asc" }],
        });
        return { success: true, data: rates };
    } catch (error) {
        console.error("Failed to fetch commission rates:", error);
        return { success: false, error: "Failed to fetch rates", data: [] };
    }
}

export async function upsertBrokerCommissionRate(data: {
    id?: string;
    brokerId: string;
    symbol: string;
    commissionPerLot: number;
    currency?: string;
    effectiveFrom?: string | Date;
}) {
    try {
        const sessionUser = await requireAdminAuth();
        const upperSymbol = data.symbol.trim().toUpperCase();
        const rateNum = Number(data.commissionPerLot);

        if (isNaN(rateNum) || rateNum < 0) {
            return { success: false, error: "Commission per lot must be a non-negative number" };
        }
        if (!data.brokerId) {
            return { success: false, error: "Broker is required" };
        }
        if (!upperSymbol) {
            return { success: false, error: "Symbol is required" };
        }

        let result;
        if (data.id) {
            result = await prisma.brokerCommissionRate.update({
                where: { id: data.id },
                data: {
                    brokerId: data.brokerId,
                    symbol: upperSymbol,
                    commissionPerLot: rateNum,
                    currency: data.currency || "USD",
                    effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
                },
                include: {
                    broker: { select: { id: true, name: true, slug: true, color: true, logo: true } },
                },
            });

            await prisma.auditLog.create({
                data: {
                    adminId: sessionUser.id,
                    action: "UPDATE_COMMISSION_RATE",
                    targetType: "BROKER_COMMISSION_RATE",
                    targetId: result.id,
                    details: { brokerId: data.brokerId, symbol: upperSymbol, commissionPerLot: rateNum },
                },
            });
        } else {
            result = await prisma.brokerCommissionRate.create({
                data: {
                    brokerId: data.brokerId,
                    symbol: upperSymbol,
                    commissionPerLot: rateNum,
                    currency: data.currency || "USD",
                    effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
                },
                include: {
                    broker: { select: { id: true, name: true, slug: true, color: true, logo: true } },
                },
            });

            await prisma.auditLog.create({
                data: {
                    adminId: sessionUser.id,
                    action: "CREATE_COMMISSION_RATE",
                    targetType: "BROKER_COMMISSION_RATE",
                    targetId: result.id,
                    details: { brokerId: data.brokerId, symbol: upperSymbol, commissionPerLot: rateNum },
                },
            });
        }

        revalidatePath("/admin/trading-systems/brokers");
        revalidatePath("/admin/ib");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Failed to upsert broker commission rate:", error);
        if (error?.code === "P2002") {
            return {
                success: false,
                error: "A commission rate rule for this broker and symbol already exists",
            };
        }
        return { success: false, error: error?.message || "Failed to save commission rate" };
    }
}

export async function deleteBrokerCommissionRate(id: string) {
    try {
        const sessionUser = await requireAdminAuth();
        const existing = await prisma.brokerCommissionRate.findUnique({
            where: { id },
            include: { broker: { select: { slug: true } } },
        });
        if (!existing) return { success: false, error: "Rate not found" };

        await prisma.brokerCommissionRate.delete({ where: { id } });

        await prisma.auditLog.create({
            data: {
                adminId: sessionUser.id,
                action: "DELETE_COMMISSION_RATE",
                targetType: "BROKER_COMMISSION_RATE",
                targetId: id,
                details: {
                    brokerId: existing.brokerId,
                    brokerSlug: existing.broker?.slug,
                    symbol: existing.symbol,
                    commissionPerLot: existing.commissionPerLot,
                },
            },
        });

        revalidatePath("/admin/trading-systems/brokers");
        revalidatePath("/admin/ib");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete broker commission rate:", error);
        return { success: false, error: "Failed to delete commission rate" };
    }
}
