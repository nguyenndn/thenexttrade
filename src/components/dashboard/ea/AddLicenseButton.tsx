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
                className="w-full md:w-auto"
            >
                <Plus size={20} />
                <span className="hidden md:inline">Add Account</span>
                <span className="md:hidden">Add</span>
            </Button>

            <AddLicenseModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
