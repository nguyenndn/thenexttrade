"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { CopyTradingOverview } from "@/components/copy-trading/CopyTradingOverview";
import { CopyTradingMyAccount } from "@/components/copy-trading/CopyTradingMyAccount";
import { Copy, User } from "lucide-react";

export default function CopyTradingPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                title="Copy Trading"
                description="Powered by PVSR Capital — institutional-grade trade synchronization."
            />

            <Tabs defaultValue="overview" tabsId="copy-trading">
                <div className="mb-4">
                    <TabsList>
                        <TabsTrigger value="overview">
                            <Copy size={15} />
                            <span>Overview</span>
                        </TabsTrigger>
                        <TabsTrigger value="my-account">
                            <User size={15} />
                            <span>My Account</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview">
                    <CopyTradingOverview />
                </TabsContent>

                <TabsContent value="my-account">
                    <CopyTradingMyAccount />
                </TabsContent>
            </Tabs>
        </div>
    );
}
