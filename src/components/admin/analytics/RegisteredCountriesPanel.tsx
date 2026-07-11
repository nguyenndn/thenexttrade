'use client';

import { Globe2 } from 'lucide-react';
import { getCountryFlag, getCountryName } from '@/lib/country-utils';

interface Props {
 countries: Array<{ country: string; users: number }>;
}

export function RegisteredCountriesPanel({ countries }: Props) {
 const total = countries.reduce((sum, country) => sum + country.users, 0);

 return (
 <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <Globe2 className="w-4 h-4 text-emerald-500" />
 <h2 className="text-sm font-bold text-gray-900 dark:text-white">
 Registered User Countries
 </h2>
 </div>
 <span className="text-xs text-gray-400">
 {countries.length} countries
 </span>
 </div>

 <div className="space-y-1 overflow-y-auto pr-1 max-h-[360px]">
 {countries.map((country, index) => {
 const pct = total > 0 ? Math.round((country.users / total) * 100) : 0;

 return (
 <div
 key={country.country}
 className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
 >
 <span className="text-xs w-5 text-center shrink-0 text-gray-400 font-mono">
 {index + 1}
 </span>
 <span className="text-base shrink-0">{getCountryFlag(country.country)}</span>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <div className="min-w-0">
 <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate block">
 {getCountryName(country.country)}
 </span>
 <span className="text-[10px] text-gray-400 uppercase tracking-widest">
 {country.country}
 </span>
 </div>
 <div className="flex items-center gap-2 shrink-0 ml-2">
 <span className="text-xs text-gray-400">{pct}%</span>
 <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
 {country.users.toLocaleString()}
 </span>
 </div>
 </div>
 <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1">
 <div
 className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1 rounded-full transition-all duration-500"
 style={{ width: `${Math.max(pct, 1)}%` }}
 />
 </div>
 </div>
 </div>
 );
 })}

 {!countries.length && (
 <div className="text-center py-12">
 <Globe2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
 <p className="text-sm text-gray-400">
 No registered user country data yet.
 </p>
 </div>
 )}
 </div>
 </div>
 );
}

