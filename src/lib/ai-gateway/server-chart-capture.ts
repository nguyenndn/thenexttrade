import { chromium } from "@playwright/test";

export interface ServerChartCaptureOptions {
    symbol?: string;
    interval?: string;
    theme?: "dark" | "light";
    width?: number;
    height?: number;
}

/**
 * Server-side auto snapshot of TradingView Chart using Playwright Chromium.
 * Renders the chart with exact specified parameters and returns PNG buffer.
 */
export async function captureTradingViewChartServerSide(
    options: ServerChartCaptureOptions = {}
): Promise<Buffer> {
    const {
        symbol = "OANDA:XAUUSD",
        interval = "60",
        theme = "dark",
        width = 1280,
        height = 800,
    } = options;

    let browser = null;

    try {
        browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage({
            viewport: { width, height },
        });

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            html, body, #chart_container {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background-color: ${theme === "dark" ? "#111318" : "#ffffff"};
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div id="chart_container"></div>
          <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
          <script type="text/javascript">
            new TradingView.widget({
              "autosize": true,
              "symbol": "${symbol}",
              "interval": "${interval}",
              "timezone": "Asia/Ho_Chi_Minh",
              "theme": "${theme}",
              "style": "1",
              "locale": "en",
              "allow_symbol_change": true,
              "hide_top_toolbar": false,
              "hide_side_toolbar": false,
              "hide_volume": true,
              "hide_legend": true,
              "calendar": false,
              "container_id": "chart_container"
            });
          </script>
        </body>
        </html>
        `;

        await page.setContent(htmlContent);

        // Wait for iframe rendering and candlestick charts to render stably
        await page.waitForTimeout(3000);

        const screenshotBuffer = await page.screenshot({ type: "png" });
        return screenshotBuffer;
    } catch (error) {
        console.error("[ServerChartCapture Error]:", error);
        throw new Error(
            "Failed to auto-capture chart snapshot. Please try again or upload a screenshot."
        );
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
    }
}
