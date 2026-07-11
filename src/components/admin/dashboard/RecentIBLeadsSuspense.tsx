import { prisma } from "@/lib/prisma";
import { RecentIBLeadsWidget } from "@/components/admin/widgets/RecentIBLeadsWidget";

export async function RecentIBLeadsSuspense() {
  try {
    const leads = await prisma.ibLead.findMany({
      take: 5,
      orderBy: { clickedAt: "desc" },
      include: {
        user: { select: { name: true, email: true, image: true } }
      }
    });

    const formattedLeads = leads.map(lead => ({
      id: lead.id,
      broker: lead.broker,
      source: lead.source,
      clickedAt: lead.clickedAt,
      convertedAt: lead.convertedAt,
      user: lead.user
    }));

    return <RecentIBLeadsWidget leads={formattedLeads} />;
  } catch (error) {
    console.error("Error fetching IB leads:", error);
    return <RecentIBLeadsWidget leads={[]} />;
  }
}
