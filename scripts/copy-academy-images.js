const fs = require("fs");
const path = require("path");

const ARTIFACTS_DIR = "C:\\Users\\Kee\\.gemini\\antigravity-ide\\brain\\388ae101-cae6-4aa4-ab33-d8d56a638553";
const REPO_ROOT = process.cwd();

const MAPPINGS = [
  { prefix: "platform_overview_", target: "public/images/academy/level-02/module-03/platform-overview.png" },
  { prefix: "order_types_market_vs_pending_", target: "public/images/academy/level-02/module-03/order-types-market-vs-pending.png" },
  { prefix: "sl_tp_ticket_", target: "public/images/academy/level-02/module-03/sl-tp-ticket.png" },
  { prefix: "position_management_", target: "public/images/academy/level-02/module-03/position-management.png" },
  { prefix: "calendar_columns_guide_", target: "public/images/academy/level-09/module-01/calendar-columns-guide.png" },
  { prefix: "news_reaction_phases_", target: "public/images/academy/level-09/module-01/news-reaction-phases.png" },
  { prefix: "nfp_cpi_fomc_cheatsheet_", target: "public/images/academy/level-09/module-01/nfp-cpi-fomc-cheatsheet.png" },
  { prefix: "news_trading_risk_", target: "public/images/academy/level-09/module-01/news-trading-risk.png" },
  { prefix: "demo_vs_real_mind_", target: "public/images/academy/level-12/module-01/demo-vs-real-mind.png" },
  { prefix: "loss_shock_curve_", target: "public/images/academy/level-12/module-01/loss-shock-curve.png" },
  { prefix: "emotion_to_action_traps_", target: "public/images/academy/level-12/module-01/emotion-to-action-traps.png" },
  { prefix: "realistic_capital_", target: "public/images/academy/level-12/module-01/realistic-capital.png" },
  { prefix: "lot_size_math_", target: "public/images/academy/level-12/module-01/lot-size-math.png" },
  { prefix: "expectation_reality_", target: "public/images/academy/level-12/module-01/expectation-reality.png" },
  { prefix: "four_styles_comparison_", target: "public/images/academy/level-02/module-02/four-styles-comparison.png" },
  { prefix: "style_fit_flowchart_", target: "public/images/academy/level-02/module-02/style-fit-flowchart.png" },
  { prefix: "avoid_style_hopping_", target: "public/images/academy/level-02/module-02/avoid-style-hopping.png" },
  { prefix: "mobile_vs_desktop_", target: "public/images/academy/level-02/module-03/mobile-vs-desktop.png" },
  { prefix: "price_alert_setup_", target: "public/images/academy/level-02/module-03/price-alert-setup.png" },
  { prefix: "mobile_risk_warning_", target: "public/images/academy/level-02/module-03/mobile-risk-warning.png" },
];

const artifactFiles = fs.readdirSync(ARTIFACTS_DIR);

MAPPINGS.forEach(({ prefix, target }) => {
  const match = artifactFiles.find((f) => f.startsWith(prefix) && f.endsWith(".png"));
  if (!match) {
    console.error(`ERROR: No artifact file matching prefix: ${prefix}`);
    return;
  }
  const sourcePath = path.join(ARTIFACTS_DIR, match);
  const destPath = path.join(REPO_ROOT, target);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(sourcePath, destPath);
  const stat = fs.statSync(destPath);
  console.log(`COPIED: ${match} -> ${target} (${stat.size} bytes)`);
});
