import { PublicHeader } from "@/components/layout/PublicHeader";

export default function AcademyLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <div className="min-h-screen bg-gray-50 dark:bg-transparent text-gray-700 dark:text-white font-outfit">
 <PublicHeader />
 <main>
 {children}
 </main>
 </div>
 );
}
