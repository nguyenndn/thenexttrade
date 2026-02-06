
import { NextResponse } from "next/server";
import { z } from "zod";
import { RiskCalculatorService } from "@/lib/services/risk-calculator.service";

const calculateSchema = z.object({
    accountBalance: z.number().positive("Account balance must be positive"),
    riskPercentage: z.number().positive("Risk percentage must be positive"),
    stopLossPips: z.number().positive("Stop loss must be positive"),
    currencyPair: z.string().min(6, "Invalid currency pair"),
    openPrice: z.number().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const validation = calculateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.error.format() },
                { status: 400 }
            );
        }

        const result = RiskCalculatorService.calculate(validation.data);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Risk Calc Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
