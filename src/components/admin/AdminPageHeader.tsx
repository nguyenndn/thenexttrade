interface AdminPageHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {title}
                    </h1>
                </div>
                <p className="text-base text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    {description}
                </p>
            </div>
            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
}
