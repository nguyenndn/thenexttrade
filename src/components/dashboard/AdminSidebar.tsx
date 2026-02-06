
"use client";

import { Sidebar } from "./Sidebar";
import { adminMenuItems } from "@/config/navigation";

export function AdminSidebar() {
    return <Sidebar items={adminMenuItems} />;
}
