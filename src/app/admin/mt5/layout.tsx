"use client";

import { Cpu, Database, Key } from "lucide-react";
import { TabBar } from "@/components/ui/TabBar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const tabs = [
  { label: "Background Workers", href: "/admin/mt5", icon: Cpu },
  { label: "Import Jobs", href: "/admin/mt5/jobs", icon: Database },
  { label: "Enrollment Tokens", href: "/admin/mt5/tokens", icon: Key },
];

export default function Mt5ImportAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 pb-10">
      <AdminPageHeader
        title="MT5 History Import Console"
        description="Monitor active background workers, inspect data import jobs, and issue secure client enrollment tokens."
      />

      {/* Tabs */}
      <TabBar tabs={tabs} />

      {/* Content */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
