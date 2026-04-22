import { redirect } from 'next/navigation';

export default async function OldProductRedirect({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    
    // 1. Ambil kalimat dari link usang (kabel-siemens-abc -> kabel siemens abc)
    const cleanQuery = slug.join(' ').replace(/-/g, ' ');
    
    // 2. Redirect 301 secara permanen ke sistem pencarian pintar kita
    // Google akan diarahkan langsung mencari SKU-nya!
    redirect(`/pencarian?q=${encodeURIComponent(cleanQuery)}`);
}
