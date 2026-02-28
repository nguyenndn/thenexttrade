
export const BROKERS: Record<string, {
    name: string;
    logo: string;
    ibDashboardUrl: string;
    color: string;
}> = {
    EXNESS: {
        name: "Exness",
        logo: "/images/brokers/exness.png",
        ibDashboardUrl: "https://my.exness.com/pa/",
        color: "#FFD700",
    },
    VANTAGE: {
        name: "Vantage",
        logo: "/images/brokers/vantage.png",
        ibDashboardUrl: "https://portal.vantagemarkets.com/",
        color: "#1E90FF",
    },
    VTMARKETS: {
        name: "VTmarkets",
        logo: "/images/brokers/vtmarkets.png",
        ibDashboardUrl: "https://portal.vtmarkets.com/",
        color: "#00CED1",
    },
};
