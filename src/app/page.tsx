import dynamic from "next/dynamic";
import SiteHeader from "@/components/layout/SiteHeader";
import HeroSlider from "@/components/home/HeroSlider";
import CategorySection from "@/components/home/CategorySection";
import Footer from "@/components/layout/Footer";
import { Suspense } from "react";

// Lazy load components that are below the fold
const ClientPortfolioSection = dynamic(() => import("@/components/home/ClientPortfolioSection"), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />
});
const PromoBanners = dynamic(() => import("@/components/home/PromoBanners"), {
  loading: () => <div className="h-48 animate-pulse bg-gray-100" />
});
const NewsSection = dynamic(() => import("@/components/home/NewsSection"), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />
});

import { getSiteSetting } from "@/app/actions/settings";
import { getLatestNews } from "@/app/actions/news";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

export const revalidate = 3600;

// Cache homepage data
const getClientProjects = unstable_cache(
  async () => db.clientProject.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    where: { isVisible: true }
  }),
  ['client-projects'],
  { revalidate: 3600, tags: ['settings'] }
);

const getActiveBanners = unstable_cache(
  async () => db.banner.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" }
  }),
  ['active-banners'],
  { revalidate: 3600, tags: ['settings'] }
);

export default async function Home() {
  // Fetch everything in one go
  const [savedGridSettings, clientProjects, latestNews, activeBanners] = await Promise.all([
    getSiteSetting("homepage_grid_categories"),
    getClientProjects(),
    getLatestNews(4),
    getActiveBanners()
  ]);

  let gridCategories: any[] = [];

  if (savedGridSettings && Array.isArray(savedGridSettings) && savedGridSettings.length > 0) {
    const gridItems: { id: string, customName?: string }[] = savedGridSettings.map((item: any) => {
      if (typeof item === 'string') return { id: item };
      return { id: item.id, customName: item.customName };
    });

    if (gridItems.length > 0) {
      const ids = gridItems.map(i => i.id);
      const cats = await db.category.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, image: true }
      });

      gridCategories = gridItems
        .map(item => {
          const cat = cats.find(c => c.id === item.id);
          if (!cat) return null;
          return {
            ...cat,
            name: item.customName || cat.name,
            originalName: cat.name
          };
        })
        .filter(Boolean);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <HeroSlider banners={activeBanners} />
      <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>}>
        <CategorySection categories={gridCategories} />
        <ClientPortfolioSection projects={clientProjects} />
        <PromoBanners />
        <NewsSection news={latestNews} />
      </Suspense>
      <Footer />
    </div>
  );
}
