"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/config/navigation";

export function DesktopNav() {
 const pathname = usePathname();

 return (
 <nav className="hidden lg:flex items-center gap-4 xl:gap-6 relative flex-1 justify-center">
 {menuItems.map((item) => {
 const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

 return (
 <Link
 key={item.name}
 href={item.href}
 aria-current={isActive ? "page" : undefined}
 className={[
 "relative py-1.5 text-base nav-menu-text transition-colors group",
 isActive
 ? "text-gray-950 dark:text-white"
 : "text-gray-700 hover:text-amber-600 dark:text-gray-300 dark:hover:text-amber-300",
 ].join(" ")}
 >
 {item.name}
 <span
 className={[
 "absolute -bottom-1 left-0 h-[2px] w-full origin-center rounded-full bg-amber-500 transition-all duration-300 ease-out",
 isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100",
 ].join(" ")}
 />
 </Link>
 );
 })}
 </nav>
 );
}
