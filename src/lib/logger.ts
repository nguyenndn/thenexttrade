import { prisma } from "@/lib/prisma";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogContext {
    [key: string]: any;
}

class LoggerService {
    private static instance: LoggerService;
    private isDev: boolean;

    private constructor() {
        this.isDev = process.env.NODE_ENV === "development";
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    private async saveToDb(level: LogLevel, message: string, context?: LogContext, stack?: string) {
        try {
            // Only save WARN and ERROR to DB to prevent bloating
            if (level !== "ERROR" && level !== "WARN") return;

            await prisma.errorLog.create({
                data: {
                    message,
                    severity: level,
                    context: context ? JSON.stringify(context) : undefined,
                    stack: stack
                }
            });
        } catch (error) {
            // Fallback if DB logging fails
            console.error("Failed to write log to DB:", error);
        }
    }

    private formatMessage(level: LogLevel, message: string, context?: LogContext) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? JSON.stringify(context) : "";
        return `[${timestamp}] [${level}] ${message} ${contextStr}`;
    }

    public info(message: string, context?: LogContext) {
        const formatted = this.formatMessage("INFO", message, context);
        console.log(formatted);
    }

    public debug(message: string, context?: LogContext) {
        if (this.isDev) {
            const formatted = this.formatMessage("DEBUG", message, context);
            console.debug(formatted);
        }
    }

    public warn(message: string, context?: LogContext) {
        const formatted = this.formatMessage("WARN", message, context);
        console.warn(formatted);
        this.saveToDb("WARN", message, context);
    }

    public error(message: string, error?: Error | unknown, context?: LogContext) {
        const errorStack = error instanceof Error ? error.stack : String(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const fullMessage = `${message}: ${errorMessage}`;

        const formatted = this.formatMessage("ERROR", fullMessage, context);
        console.error(formatted);

        // In console, print stack trace cleanly
        if (error instanceof Error && this.isDev) {
            console.error(error.stack);
        }

        this.saveToDb("ERROR", fullMessage, context, errorStack);
    }
}

export const logger = LoggerService.getInstance();
