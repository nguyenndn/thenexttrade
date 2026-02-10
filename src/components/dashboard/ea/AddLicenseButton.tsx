"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AddLicenseModal } from "@/components/dashboard/ea/AddLicenseModal";
import { Plus } from "lucide-react";

export function AddLicenseButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="primary"
                onClick={() => setIsOpen(true)}
                className="w-full md:w-auto px-8 py-3 h-auto text-base font-bold rounded-xl bg-primary hover:bg-[#00B078] text-white shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all"
            >
                <Plus size={20} />
                <span className="hidden md:inline">Add Account</span>
                <span className="md:hidden">Add</span>
            </Button>

            <AddLicenseModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
