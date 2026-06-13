import { redirect, notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { EmailLabClient } from "./EmailLabClient";

export const dynamic = "force-dynamic";

export const metadata = {
 title: "Email Lab | Admin Terminal",
 description: "Internal email template test suite for administrators",
};

export default async function EmailLabPage() {
 // 1. Authorize Admin role
 const user = await getAuthUser();
 if (!user) {
 redirect("/auth/login");
 }

 const profile = await prisma.profile.findUnique({
 where: { userId: user.id },
 select: { role: true }
 });

 if (profile?.role !== "ADMIN") {
 redirect("/dashboard");
 }

 // 2. Security switch
 if (process.env.ENABLE_EMAIL_TEST_PAGE !== "true") {
 notFound();
 }

 // 3. Safe environment configs to pass to client
 const defaultRecipient = process.env.EMAIL_TEST_TO || "";
 const allowCustomRecipient = process.env.EMAIL_TEST_ALLOW_CUSTOM_TO === "true";

 return (
 <div className="w-full max-w-full py-6 pr-6">
 <EmailLabClient 
 defaultRecipient={defaultRecipient}
 allowCustomRecipient={allowCustomRecipient}
 />
 </div>
 );
}
