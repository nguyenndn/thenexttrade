
import CategoryList from "@/components/admin/cms/CategoryList";

export const metadata = {
    title: "Categories | Admin Dashboard",
};

export default function CategoriesPage() {
    return (
        <div className="pb-10">
            <CategoryList />
        </div>
    );
}
