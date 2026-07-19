import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex justify-center items-center py-40">
            <Loader2 size={32} className="animate-spin text-primary" />
        </div>
    );
}
