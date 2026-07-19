import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { EdgeInfoContent } from "./EdgeInfoContent";

interface EdgeInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EdgeInfoModal({ isOpen, onClose }: EdgeInfoModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-50 dark:bg-[#0B0E14] border-dashboard dark:border-gray-800 p-0">
                <DialogHeader className="p-6 pb-2 sticky top-0 bg-slate-50/95 dark:bg-[#0B0E14]/95 backdrop-blur-sm z-10 border-b border-dashboard dark:border-gray-800/50">
                    <DialogTitle className="text-xl font-bold">
                        About Edge Gamification
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6 pt-4">
                    <EdgeInfoContent />
                </div>
            </DialogContent>
        </Dialog>
    );
}
