import { getGoalsProgress } from "@/actions/goals";
import { GoalsTracker } from "@/components/dashboard/GoalsTracker";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
    const goalsProgress = await getGoalsProgress();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Goals</h1>
                <p className="text-sm text-gray-500 mt-1">Set targets, track your weekly and monthly trading performance.</p>
            </div>
            <GoalsTracker goals={goalsProgress} />
        </div>
    );
}
