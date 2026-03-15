import { getGoalsProgress } from "@/actions/goals";
import { GoalsTracker } from "@/components/dashboard/GoalsTracker";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
    const goalsProgress = await getGoalsProgress();

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <p className="text-base text-primary font-semibold border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-r-lg px-4 py-2 w-fit">Set targets, track your weekly and monthly trading performance.</p>
            </div>
            <GoalsTracker goals={goalsProgress} />
        </div>
    );
}
