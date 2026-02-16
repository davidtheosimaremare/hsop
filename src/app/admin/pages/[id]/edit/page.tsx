import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageForm } from "../../_components/PageForm";

interface EditPagePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditPagePage({ params }: EditPagePageProps) {
    const { id } = await params;
    const page = await db.page.findUnique({
        where: { id },
    });

    if (!page) {
        notFound();
    }

    return <PageForm initialData={page as any} isEdit />;
}
