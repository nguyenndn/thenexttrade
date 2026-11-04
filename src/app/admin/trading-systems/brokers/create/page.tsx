"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEABroker } from "../actions";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/FileUpload";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function CreateEABrokerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState("");
    const [logo, setLogo] = useState("");
    const [affiliateUrl, setAffiliateUrl] = useState("");
    const [ibCode, setIBCode] = useState("");
    const [color, setColor] = useState("#00C888");
    const [order, setOrder] = useState("0");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !logo.trim()) {
            toast.error("Name and Logo are required");
            return;
        }

        setLoading(true);
        const slug = name
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "_")
            .replace(/(^_|_$)+/g, "");

        try {
            const result = await createEABroker({
                name,
                slug,
                logo,
                affiliateUrl: affiliateUrl || undefined,
                ibCode: ibCode || undefined,
                color,
                order: parseInt(order) || 0,
            });

            if (result.success) {
                toast.success("EA Broker created successfully!");
                router.push("/admin/trading-systems/brokers");
            } else {
                toast.error(result.error || "Failed to create broker");
            }
        } catch (error: any) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : error?.message || "An unexpected error occurred"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            <AdminPageHeader
                title="Add EA Broker"
                description="Create a new supported EA broker configuration."
                backHref="/admin/trading-systems/brokers"
            />

            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <PremiumInput
                        label="Broker Name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Logo
                        </label>
                        <FileUpload
                            value={logo}
                            onChange={setLogo}
                            className="bg-white dark:bg-black/20 w-40"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Transparent PNG recommended. Square aspect ratio.
                        </p>
                    </div>

                    <PremiumInput
                        label="IB / Affiliate Link"
                        type="url"
                        value={affiliateUrl}
                        onChange={(e) => setAffiliateUrl(e.target.value)}
                        helperText="Partner registration or IB referral URL"
                    />

                    <PremiumInput
                        label="IB Code / Number"
                        value={ibCode}
                        onChange={(e) => setIBCode(e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <PremiumInput
                            label="Brand Color"
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                        />
                        <PremiumInput
                            label="Display Order"
                            type="number"
                            value={order}
                            onChange={(e) => setOrder(e.target.value)}
                            min={0}
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end">
                        <Button
                            type="submit"
                            disabled={loading}
                            isLoading={loading}
                            className="w-full md:w-auto px-8 py-3 h-auto text-base font-bold rounded-lg bg-gold hover:bg-amber-600 !text-white border-none shadow-md shadow-amber-500/20 transition-all"
                        >
                            {!loading && (
                                <Briefcase size={20} className="mr-2" />
                            )}
                            Create EA Broker
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
