import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export async function generatePDF(data: any) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 200, 136); // Primary Green
    doc.text("Trading Performance Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${data.generatedAt}`, 14, 28);
    doc.text(`Period: ${data.period}`, 14, 33);
    doc.text(`Trader: ${data.userName}`, 14, 38);

    // Summary Metrics
    let yPos = 50;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Performance Summary", 14, yPos);

    yPos += 10;
    const summaryData = [
        ["Net P/L", `$${data.summary.netPnL.toFixed(2)}`, "Win Rate", `${data.summary.winRate.toFixed(1)}%`],
        ["Profit Factor", data.summary.profitFactor.toFixed(2), "Total Trades", data.summary.totalTrades],
        ["Avg Win", `$${data.summary.avgWin.toFixed(2)}`, "Avg Loss", `$${data.summary.avgLoss.toFixed(2)}`],
        ["Largest Win", `$${data.summary.largestWin.toFixed(2)}`, "Largest Loss", `$${data.summary.largestLoss.toFixed(2)}`],
    ];

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: summaryData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: 100 },
            1: { fontStyle: 'bold' },
            2: { fontStyle: 'bold', textColor: 100 },
            3: { fontStyle: 'bold' }
        }
    });

    // By Strategy
    yPos = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Performance by Strategy", 14, yPos);

    autoTable(doc, {
        startY: yPos + 5,
        head: [['Strategy', 'Trades', 'Win Rate', 'P/L']],
        body: data.byStrategy.map((s: any) => [
            s.name,
            s.trades,
            `${s.winRate.toFixed(1)}%`,
            `$${s.pnl.toFixed(2)}`
        ]),
        headStyles: { fillColor: [0, 200, 136] },
        theme: 'grid'
    });

    // By Pair
    yPos = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Performance by Pair", 14, yPos);

    autoTable(doc, {
        startY: yPos + 5,
        head: [['Symbol', 'Trades', 'Win Rate', 'P/L']],
        body: data.byPair.slice(0, 10).map((p: any) => [
            p.symbol,
            p.trades,
            `${p.winRate.toFixed(1)}%`,
            `$${p.pnl.toFixed(2)}`
        ]),
        headStyles: { fillColor: [47, 128, 237] }, // Blue
        theme: 'grid'
    });

    // Recent Trades
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Recent Trades", 14, 20);

    autoTable(doc, {
        startY: 25,
        head: [['Date', 'Symbol', 'Type', 'Result', 'P/L']],
        body: data.recentTrades.map((t: any) => [
            t.date,
            t.symbol,
            t.type,
            t.result,
            `$${t.pnl.toFixed(2)}`
        ]),
        headStyles: { fillColor: [20, 20, 30] },
        theme: 'striped'
    });

    // Save
    doc.save(`Trading_Report_${data.startDate}_${data.endDate}.pdf`);
}
