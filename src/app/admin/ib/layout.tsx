import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function IbOperationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-6 pb-10">
            <AdminPageHeader
                title="Partner Pro Operations"
                description="Control the partner funnel from broker click to approved Pro user and real trading activity."
            />

            {/* Content */}
            <div>{children}</div>
        </div>
    );
}

