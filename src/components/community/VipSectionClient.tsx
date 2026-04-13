"use client";

import { useState } from "react";
import { VipRequestForm } from "./VipRequestForm";
import { VipRequestStatus } from "./VipRequestStatus";
import type { VipRequest } from "@prisma/client";

interface VipSectionClientProps {
  request: VipRequest | null;
  vipLink: string | null;
  userEmail: string;
  userName?: string;
}

export function VipSectionClient({
  request,
  vipLink,
  userEmail,
  userName,
}: VipSectionClientProps) {
  const [showForm, setShowForm] = useState(false);

  // If user has a request, show status
  if (request && !showForm) {
    // If rejected, allow retry
    if (request.status === "REJECTED") {
      return (
        <VipRequestStatus
          request={request}
          vipLink={vipLink}
          onReset={() => setShowForm(true)}
        />
      );
    }
    return <VipRequestStatus request={request} vipLink={vipLink} />;
  }

  // Show form (new request or retry after rejection)
  return (
    <VipRequestForm userEmail={userEmail} userName={userName || undefined} />
  );
}
