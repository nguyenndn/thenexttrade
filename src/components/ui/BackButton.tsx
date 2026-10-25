"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function BackButton() {
    return (
        <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="rounded-full gap-2"
        >
            <ArrowLeft size={16} />
            Go Back
        </Button>
    );
}
