import { countries } from "@/lib/data/countries";

const COUNTRY_CODE_RE = /^[A-Z]{2}$/;

const countryNameByCode = new Map(
    countries.map((country) => [country.code.toUpperCase(), country.name])
);
const countryCodeByName = new Map(
    countries.map((country) => [
        normalizeCountryName(country.name),
        country.code.toUpperCase(),
    ])
);

countryCodeByName.set(normalizeCountryName("Vietnam"), "VN");
countryCodeByName.set(normalizeCountryName("Viet Nam"), "VN");
countryCodeByName.set(normalizeCountryName("United States of America"), "US");
countryCodeByName.set(normalizeCountryName("USA"), "US");

function normalizeCountryName(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");
}

export function normalizeCountryCode(value?: string | null) {
    const country = value?.trim().toUpperCase();
    if (!country) return null;
    if (COUNTRY_CODE_RE.test(country)) return country;

    return countryCodeByName.get(normalizeCountryName(value ?? "")) ?? null;
}

export function getCountryName(code?: string | null) {
    const normalized = normalizeCountryCode(code);
    if (!normalized) return "Unknown";
    return countryNameByCode.get(normalized) ?? normalized;
}

export function getCountrySearchValues(value?: string | null) {
    const code = normalizeCountryCode(value);
    if (!code) return [];

    const values = new Set<string>([code]);
    const name = countryNameByCode.get(code);
    if (name) values.add(name);

    if (code === "VN") {
        values.add("VietNam");
        values.add("Viet Nam");
    }

    if (code === "US") {
        values.add("USA");
        values.add("United States of America");
    }

    return Array.from(values);
}

export function getCountryFlag(code?: string | null) {
    const normalized = normalizeCountryCode(code);
    if (!normalized) return "";

    return String.fromCodePoint(
        ...normalized.split("").map((char) => 127397 + char.charCodeAt(0))
    );
}
