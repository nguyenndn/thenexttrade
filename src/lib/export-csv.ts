/**
 * Export data as CSV file download.
 * @param data - Array of objects to export
 * @param filename - Output filename (without extension)
 */
export function exportCSV(data: Record<string, unknown>[], filename: string) {
 if (!data.length) return;

 const headers = Object.keys(data[0]);
 const csvRows = [
 headers.join(','),
 ...data.map(row =>
 headers.map(h => {
 const val = row[h];
 const str = val === null || val === undefined ? '' : String(val);
 // Escape commas and quotes
 return str.includes(',') || str.includes('"') || str.includes('\n')
 ? `"${str.replace(/"/g, '""')}"`
 : str;
 }).join(',')
 ),
 ];

 const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `${filename}.csv`;
 link.click();
 URL.revokeObjectURL(url);
}
