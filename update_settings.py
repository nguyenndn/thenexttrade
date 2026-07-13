import re

file_path = "src/actions/accounts.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add encryptPassword import
if 'import { encryptPassword }' not in content:
    content = content.replace('import crypto from "crypto";', 'import crypto from "crypto";\nimport { encryptPassword } from "@/lib/crypto";')

# 2. Update accountSchema
schema_pattern = r"const accountSchema = z\.object\(\{\s*name: z\.string\(\)\.min\(1\)\.max\(50\),\s*broker: z\.string\(\)\.optional\(\),\s*accountNumber: z\.string\(\)\.max\(20\)\.optional\(\),"
schema_repl = """const accountSchema = z.object({
  name: z.string().min(1).max(50),
  broker: z.string().optional(),
  accountNumber: z.string().max(20).optional(),
  server: z.string().optional(),
  investorPassword: z.string().optional(),"""
content = re.sub(schema_pattern, schema_repl, content, count=1)

# 3. Update updateTradingAccount
update_func_pattern = r"(try \{\s*)(if \(data\.isDefault\) \{\s*await prisma\.tradingAccount\.updateMany\(\{)"
update_func_repl = r"""\1const { investorPassword, ...accountData } = validation.data;

    \2"""
content = re.sub(update_func_pattern, update_func_repl, content, count=1)

update_prisma_pattern = r"(await prisma\.tradingAccount\.update\(\{\s*where: \{ id, userId: user\.id \},\s*data: )validation\.data(\s*\}\);)"
update_prisma_repl = r"""\1accountData\2

    if (investorPassword) {
      const encrypted = encryptPassword(investorPassword);
      await prisma.tradingAccountCredential.upsert({
        where: { accountId: id },
        create: {
          accountId: id,
          encryptedPassword: encrypted,
          keyVersion: "v1",
        },
        update: {
          encryptedPassword: encrypted,
          keyVersion: "v1",
        },
      });
    }"""
content = re.sub(update_prisma_pattern, update_prisma_repl, content, count=1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("accounts.ts updated successfully")

file_path2 = "src/components/trading-accounts/AccountSettingsModal.tsx"
with open(file_path2, "r", encoding="utf-8") as f:
    content2 = f.read()

# 1. Add AlertCircle import
if 'AlertCircle' not in content2:
    content2 = content2.replace('import { X, Check, RefreshCw, Trash2, Shield } from "lucide-react";', 'import { X, Check, RefreshCw, Trash2, Shield, AlertCircle } from "lucide-react";')

# 2. Add state
state_pattern = r"(const \[name, setName\] = useState\(account\.name\);\s*const \[color, setColor\] = useState\(account\.color \|\| \"hsl\(var\(--primary\)\)\"\);)"
state_repl = r"""\1
  const [broker, setBroker] = useState(account.broker || "");
  const [server, setServer] = useState(account.server || "");
  const [investorPassword, setInvestorPassword] = useState("");"""
content2 = re.sub(state_pattern, state_repl, content2, count=1)

# 3. Update handleSave
save_pattern = r"(const result = await updateTradingAccount\(account\.id, \{\s*name,\s*color,)"
save_repl = r"""\1
      broker: broker || undefined,
      server: server || undefined,
      investorPassword: investorPassword || undefined,"""
content2 = re.sub(save_pattern, save_repl, content2, count=1)

# 4. Add MT5 Configuration
mt5_config = """
          </div>
        </div>
        
        {/* MT5 Configuration */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            MT5 Configuration
          </h3>
          
          <div className="space-y-3">
             <PremiumInput
              label="Account Number"
              value={account.accountNumber || ""}
              disabled
              helperText="Cannot be changed after creation."
            />
            <div className="grid grid-cols-2 gap-3">
              <PremiumInput
                label="Broker"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                placeholder="e.g. IC Markets"
              />
              <PremiumInput
                label="Server"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="e.g. ICMarketsSC-Demo"
              />
            </div>
            <PremiumInput
              label="Update Investor Password (optional)"
              type="password"
              value={investorPassword}
              onChange={(e) => setInvestorPassword(e.target.value)}
              placeholder="••••••••"
              helperText="Leave blank to keep your current password."
            />
            
            {investorPassword && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Investor Password Notice</p>
                  <p className="text-[11px] mt-0.5 text-amber-600/70 dark:text-amber-400/60">
                    This updates the password for background syncing. Please ensure it matches your MT5 Investor Password exactly.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>"""
ui_pattern = r"(</div>\s*</div>\s*</div>\s*\{\/\*\s*Trading Rules \(Soft Nudge\)\s*\*\/\})"
content2 = re.sub(ui_pattern, mt5_config + r"\n\n        {/* Trading Rules (Soft Nudge) */}", content2, count=1)

with open(file_path2, "w", encoding="utf-8") as f:
    f.write(content2)

print("AccountSettingsModal.tsx updated successfully")
