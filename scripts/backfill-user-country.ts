import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { countries } from "../src/lib/data/countries";

const prisma = new PrismaClient();
const COUNTRY_CODE_RE = /^[A-Z]{2}$/;
const countryCodeByName = new Map(
    countries.map((country) => [
        normalizeCountryName(country.name),
        country.code.toUpperCase(),
    ])
);

countryCodeByName.set(normalizeCountryName("Viet Nam"), "VN");
countryCodeByName.set(normalizeCountryName("USA"), "US");
countryCodeByName.set(normalizeCountryName("United States of America"), "US");

function normalizeCountryName(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function normalizeCountryCode(value?: string | null) {
    const country = value?.trim().toUpperCase();
    if (!country) return null;
    if (COUNTRY_CODE_RE.test(country)) return country;
    return countryCodeByName.get(normalizeCountryName(value ?? "")) ?? null;
}

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) return null;
    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

async function main() {
    const supabaseAdmin = getSupabaseAdmin();
    const users = await prisma.user.findMany({
        select: {
            id: true,
            profile: { select: { country: true } },
        },
    });

    let scanned = 0;
    let updated = 0;
    let skipped = 0;

    for (const user of users) {
        scanned++;

        const existingCountry = normalizeCountryCode(user.profile?.country);
        if (existingCountry && existingCountry !== user.profile?.country) {
            await prisma.profile.upsert({
                where: { userId: user.id },
                update: { country: existingCountry },
                create: { userId: user.id, country: existingCountry },
            });
            updated++;
            continue;
        }

        if (existingCountry) {
            skipped++;
            continue;
        }

        let country: string | null = null;

        if (supabaseAdmin) {
            const { data } = await supabaseAdmin.auth.admin.getUserById(user.id);
            country = normalizeCountryCode(
                typeof data.user?.user_metadata?.country === "string"
                    ? data.user.user_metadata.country
                    : null
            );
        }

        const event = await prisma.analyticsEvent.findFirst({
            where: {
                userId: user.id,
                country: { not: null },
            },
            orderBy: { createdAt: "desc" },
            select: { country: true },
        });

        country ||= normalizeCountryCode(event?.country);
        if (!country) {
            skipped++;
            continue;
        }

        await prisma.profile.upsert({
            where: { userId: user.id },
            update: { country },
            create: { userId: user.id, country },
        });
        updated++;
    }

    console.log(
        JSON.stringify(
            {
                scanned,
                updated,
                skipped,
            },
            null,
            2
        )
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
