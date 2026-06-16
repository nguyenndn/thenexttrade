"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { createTraderGoal } from "@/actions/rulebook";
import { toast } from "sonner";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

const goalFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(140),
  type: z.enum(["JOURNAL_COUNT", "REVIEW_LOSSES", "CHECK_RULES", "STOP_AFTER_LOSSES", "STUDY", "CUSTOM"]),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  targetValue: z.number().int().min(1, "Target value must be at least 1").nullable().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GoalModal({ isOpen, onClose, onSuccess }: GoalModalProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: "",
      type: "JOURNAL_COUNT",
      period: "WEEKLY",
      targetValue: 5,
    },
  });

  const onSubmit = (values: GoalFormValues) => {
    startTransition(async () => {
      const res = await createTraderGoal(values);
      if (res.success) {
        toast.success("Goal created successfully!");
        reset();
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to create goal.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-[#11141d] border-dashboard dark:border-white/[0.08] p-6 rounded-2xl">
        <DialogHeader className="border-b border-dashboard/80 dark:border-white/[0.08] pb-4">
          <DialogTitle className="text-lg font-bold text-gray-800 dark:text-white">
            Create Behavior Goal
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Build discipline by setting measurable habits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Goal Title */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
              Goal Title
            </label>
            <PremiumInput
              placeholder="e.g. Journal 5 trades this week"
              {...register("title")}
              error={errors.title?.message}
            />
          </div>

          {/* Type & Period Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                Goal Type
              </label>
              <select
                {...register("type")}
                className="w-full h-10 p-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#151925] text-sm text-gray-800 dark:text-white focus:outline-none"
              >
                <option value="JOURNAL_COUNT">Journal Trade Count</option>
                <option value="REVIEW_LOSSES">Review Every Loss</option>
                <option value="CHECK_RULES">Verify Trade Rules</option>
                <option value="STOP_AFTER_LOSSES">Stop After Loss Limit</option>
                <option value="STUDY">Study Lessons</option>
                <option value="CUSTOM">Custom Habits</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                Goal Period
              </label>
              <select
                {...register("period")}
                className="w-full h-10 p-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#151925] text-sm text-gray-800 dark:text-white focus:outline-none"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>

          {/* Target Value */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
              Target Value (Times / Count)
            </label>
            <PremiumInput
              type="number"
              placeholder="e.g. 5"
              {...register("targetValue", { valueAsNumber: true })}
              error={errors.targetValue?.message}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-dashboard/80 dark:border-white/[0.08] pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="h-10 border-gray-300 dark:border-white/10 font-bold"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isPending} className="h-10 font-bold">
              {isPending && <Loader2 size={14} className="animate-spin mr-1.5" />}
              Create Goal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
