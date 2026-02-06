import { Trophy } from "lucide-react";

interface TopUser {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
    progressCount: number;
}

export function TopLearnersWidget({ users }: { users: TopUser[] }) {
    return (
        <div className="bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 rounded-2xl p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Top Learners
            </h3>

            <div className="space-y-3 flex-1">
                {users.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex-shrink-0 relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                {user.name?.charAt(0) || "U"}
                            </div>
                            {index === 0 && (
                                <div className="absolute -top-1 -right-1 bg-amber-400 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] border border-white">
                                    1
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                                {user.name || "Anonymous"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user.email}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-indigo-600 dark:text-indigo-400">
                                {user.progressCount}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase font-medium">
                                Lessons
                            </div>
                        </div>
                    </div>
                ))}

                {users.length === 0 && (
                    <div className="text-center text-gray-400 py-8">No active learners yet</div>
                )}
            </div>
        </div>
    );
}
