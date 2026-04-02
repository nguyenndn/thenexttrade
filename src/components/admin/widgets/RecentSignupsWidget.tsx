import { UserPlus } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface NewUser {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt: Date;
}

export function RecentSignupsWidget({ users }: { users: NewUser[] }) {
    return (
        <div className="bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 rounded-xl p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                New Users
            </h3>

            <div className="space-y-4 flex-1">
                {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10 flex-shrink-0">
                            {user.image ? (
                                <Image 
                                    src={user.image} 
                                    alt={user.name || "User"} 
                                    fill 
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-indigo-500 font-bold">
                                    {user.name?.charAt(0) || "U"}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user.name || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                {user.email}
                            </p>
                        </div>
                        <div className="text-xs text-gray-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </div>
                    </div>
                ))}

                {users.length === 0 && (
                    <div className="text-center text-gray-400 py-8">No new users recently</div>
                )}
            </div>
        </div>
    );
}
