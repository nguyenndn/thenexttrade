"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Loader2, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { FileUpload } from "@/components/ui/FileUpload";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { updateEABroker, deleteEABroker } from "./actions";

interface EABrokerData {
    id: string;
    name: string;
    slug: string;
    logo: string;
    affiliateUrl: string | null;
    ibCode: string | null;
    color: string;
    isActive: boolean;
    order: number;
}

interface EditEABrokerModalProps {
    broker: EABrokerData;
}

export function EditEABrokerModal({ broker }: EditEABrokerModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const [name, setName] = useState(broker.name);
    const [logo, setLogo] = useState(broker.logo);
    const [affiliateUrl, setAffiliateUrl] = useState(broker.affiliateUrl || "");
    const [ibCode, setIBCode] = useState(broker.ibCode || "");
    const [color, setColor] = useState(broker.color);
    const [order, setOrder] = useState(String(broker.order));
    const [isActive, setIsActive] = useState(broker.isActive);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Broker name is required");
            return;
        }

        setSaving(true);
        try {
            const result = await updateEABroker(broker.id, {
                name,
                logo,
                affiliateUrl: affiliateUrl || null,
                ibCode: ibCode || null,
                color,
                order: parseInt(order) || 0,
                isActive,
            });

            if (result.success) {
                toast.success("Broker updated successfully!");
                setOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = () => {
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const result = await deleteEABroker(broker.id);
            if (result.success) {
                toast.success("Broker deleted successfully");
                setIsConfirmOpen(false);
                setOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete");
                setIsConfirmOpen(false);
            }
        } catch {
            toast.error("An unexpected error occurred");
            setIsConfirmOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    const handleOpen = () => {
        // Reset to current broker values when opening
        setName(broker.name);
        setLogo(broker.logo);
        setAffiliateUrl(broker.affiliateUrl || "");
        setIBCode(broker.ibCode || "");
        setColor(broker.color);
        setOrder(String(broker.order));
        setIsActive(broker.isActive);
        setOpen(true);
    };

    return (
        <>
            {/* Trigger: Edit icon button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={handleOpen}
                className="w-auto h-auto p-2 hover:bg-blue-500/10 text-blue-500 hover:text-blue-600 rounded-lg transition-colors"
                aria-label={`Edit ${broker.name}`}
            >
                <Edit size={16} />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-white dark:bg-[#1E2028] rounded-xl border-0 dark:border dark:border-white/5 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                            Edit Broker
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                            Update broker information for Trading Systems.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 mt-2">
                        <PremiumInput
                            label="Broker Name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Exness"
                        />

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Logo</label>
                            <FileUpload
                                value={logo}
                                onChange={setLogo}
                                className="bg-white dark:bg-black/20 w-32"
                            />
                        </div>

                        <PremiumInput
                            label="IB / Affiliate Link"
                            type="url"
                            value={affiliateUrl}
                            onChange={(e) => setAffiliateUrl(e.target.value)}
                            placeholder="https://one.exnesstrack.org/..."
                        />

                        <PremiumInput
                            label="IB Code / Number"
                            value={ibCode}
                            onChange={(e) => setIBCode(e.target.value)}
                            placeholder="e.g. 14647313"
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

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                                <Power size={16} className={isActive ? "text-green-500" : "text-gray-400"} />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <Switch
                                checked={isActive}
                                onCheckedChange={setIsActive}
                                aria-label="Toggle Active Status"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={confirmDelete}
                            disabled={saving || deleting}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600"
                            aria-label="Delete Broker"
                        >
                            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </Button>

                        <div className="flex-1" />

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={saving || deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleSave}
                            disabled={saving || deleting}
                            className="bg-primary hover:bg-[#00B078] text-white"
                        >
                            {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Broker"
                description={`Are you sure you want to delete "${broker.name}"? This cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </>
    );
}
