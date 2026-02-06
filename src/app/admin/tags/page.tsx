
import TagList from "@/components/admin/cms/TagList";

export const metadata = {
    title: "Tags | Admin Dashboard",
};

export default function TagsPage() {
    return (
        <div className="space-y-10">
            <TagList />
        </div>
    );
}
