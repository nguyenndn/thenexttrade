import { redirect } from "next/navigation";

export default function AdminAcademyDetailPage({ params }: { params: { id: string } }) {
    redirect(`/admin/academy`);
}
