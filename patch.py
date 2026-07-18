import re

file_path = r"c:\laragon\www\gsn-crm\src\components\reports\ReportsDashboard.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'import { GenerateReportButton } from "./GenerateReportButton";',
    'import { GenerateReportButton } from "./GenerateReportButton";\nimport { DraggablePreviewTable } from "./DraggablePreviewTable";'
)

# 2. Update format type
content = content.replace(
    'format: "pdf" | "csv" | "auto";',
    'format: "pdf" | "csv" | "auto" | "json";'
)

# 3. Add backup to REPORT_TYPES
content = content.replace(
    'icon: TrendingUp,\n  },\n];',
    'icon: TrendingUp,\n  },\n  {\n    id: "backup",\n    name: "Data Backup",\n    description: "Export all your data as JSON",\n    format: "json",\n    icon: Download,\n  },\n];'
)

# 4. Update isExportType
content = content.replace(
    'const isExportType = selectedType === "monthly" || selectedType === "trades" || selectedType === "tax";',
    'const isExportType = selectedType === "monthly" || selectedType === "trades" || selectedType === "tax" || selectedType === "backup";'
)

# 5. Update handleGenerate
content = content.replace(
    '} else {\n        // PDF - fetch data first',
    '} else if (selectedType === "backup") {\n        window.location.href = "/api/export/json";\n        setIsGenerating(false);\n        return;\n      } else {\n        // PDF - fetch data first'
)

# 6. Update Button compact layout & JSON styles
# We want to replace the whole <Button ...> to </Button>
button_regex = re.compile(r"<Button\n\s+variant=\"ghost\"\n\s+key=\{report\.id\}(.*?)<\/Button>", re.DOTALL)
new_button = '''<Button
                variant="ghost"
                key={report.id}
                onClick={() => handleSelectType(report.id)}
                className={
                  relative text-left p-3 sm:p-4 lg:p-3 h-[110px] rounded-xl border transition-all duration-300 group flex flex-col items-start justify-start whitespace-normal hover:bg-white dark:hover:bg-[#1E2028] font-normal overflow-hidden
                  
                }
              >
                <div className="flex items-start justify-between mb-2 w-full">
                  <div
                    className={
                      p-2 rounded-lg transition-all duration-300 shadow-sm
                      
                    }
                  >
                    <report.icon size={16} strokeWidth={2.5} className="w-4 h-4" />
                  </div>
                  <span
                    className={
                      text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border
                      
                    }
                  >
                    {report.format}
                  </span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-gray-700 dark:text-white mb-0.5 tracking-tight truncate w-full">
                  {report.name}
                </h3>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-snug text-left w-full line-clamp-2">
                  {report.description}
                </p>
              </Button>'''
content = button_regex.sub(new_button, content)

# 7. Replace static table with DraggablePreviewTable
table_regex = re.compile(r'<div className="overflow-x-auto rounded-xl border border-dashboard custom-scrollbar">.*?</table>\s*</div>', re.DOTALL)
new_table = '<DraggablePreviewTable initialData={csvPreview} onChange={setCsvPreview} />'
content = table_regex.sub(new_table, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully.")
