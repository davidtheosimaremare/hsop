import MarkupRulesClient from "@/components/admin/MarkupRulesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Aturan Kenaikan Harga | Admin Panel",
};

export default function AdminMarkupRulesPage() {
    return <MarkupRulesClient />;
}
