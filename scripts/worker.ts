
import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import { EMAIL_JOB_TYPES } from "@/lib/queue/email-queue";

const worker = new Worker("email-queue", async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);

    // Example job data: { type: 'WELCOME', email: '...', name: '...' }
    const { to, subject, html } = job.data;

    try {
        await sendEmail({ to, subject, html });
        console.log(`Job ${job.id} completed`);
    } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error;
    }
}, {
    connection: redis as any,
    concurrency: 5,
});

worker.on("completed", (job) => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});

console.log("Email Worker started...");
