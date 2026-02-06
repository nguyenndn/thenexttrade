
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const emailQueue = new Queue("email-queue", {
    connection: redis as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
    },
});

export const EMAIL_JOB_TYPES = {
    WELCOME: "WELCOME",
    NOTIFICATION: "NOTIFICATION",
    RESET_PASSWORD: "RESET_PASSWORD",
} as const;
