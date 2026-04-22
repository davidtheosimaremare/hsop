import { redirect } from 'next/navigation';

export default async function OldCategoryRedirect({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    
    // 1. Ambil kalimat dari link usang
    const cleanQuery = slug.join(' ').replace(/-/g, ' ');
    
    // 2. Redirect 301 (Permanen) ke sistem pencarian untuk kategori lama
    redirect(`/pencarian?q=${encodeURIComponent(cleanQuery)}`);
}
