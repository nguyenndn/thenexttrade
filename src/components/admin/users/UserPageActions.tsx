"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AddUserModal } from "./AddUserModal";

export function UserPageActions() {
    const [isAddOpen, setIsAddOpen] = useState(false);

    return (
        <>
            <Button
                variant="primary"
                onClick={() => setIsAddOpen(true)}
                className="shadow-lg shadow-primary/30"
            >
                <Plus size={18} strokeWidth={2.5} />
                Add New
            </Button>

            <AddUserModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
            />
        </>
    );
}
