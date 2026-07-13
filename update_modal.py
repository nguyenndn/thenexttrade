import re

file_path = "src/components/trading-accounts/AccountSettingsModal.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add AlertCircle import
if 'AlertCircle' not in content:
    content = content.replace('import { X, Check, RefreshCw, Trash2, Shield } from "lucide-react";', 'import { X, Check, RefreshCw, Trash2, Shield, AlertCircle } from "lucide-react";')

# 2. Add state
state_pattern = r"(const \[name, setName\] = useState\(account\.name\);\s*const \[color, setColor\] = useState\(account\.color \|\| \"hsl\(var\(--primary\)\)\"\);)"
state_repl = r"""\1
	const [broker, setBroker] = useState(account.broker || "");
	const [server, setServer] = useState(account.server || "");
	const [investorPassword, setInvestorPassword] = useState("");"""
content = re.sub(state_pattern, state_repl, content, count=1)

# 3. Update handleSave
save_pattern = r"(const result = await updateTradingAccount\(account\.id, \{\s*name,\s*color,)"
save_repl = r"""\1
					broker: broker || undefined,
					server: server || undefined,
					investorPassword: investorPassword || undefined,"""
content = re.sub(save_pattern, save_repl, content, count=1)

# 4. Add MT5 Configuration
mt5_config = """</div>
					</div>
				</div>

				{/* MT5 Configuration */}
				<div className="space-y-4">
					<h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
						MT5 Configuration
					</h3>
					
					<div className="space-y-3">
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
				</div>

				{/* Trading Rules (Soft Nudge) */}"""

ui_pattern = r"(<\/div>\s*<\/div>\s*<\/div>\s*\{\/\*\s*Trading Rules \(Soft Nudge\)\s*\*\/\})"
content = re.sub(ui_pattern, mt5_config, content, count=1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("AccountSettingsModal.tsx updated successfully")
