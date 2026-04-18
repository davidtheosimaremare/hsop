import dynamic from "next/dynamic";
import SiteHeader from "@/components/layout/SiteHeader";
import HeroSlider from "@/components/home/HeroSlider";
import CategorySection from "@/components/home/CategorySection";

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
const Footer = dynamic(() => import("@/components/layout/Footer"));

import { getSiteSetting } from "@/app/actions/settings";
import { getLatestNews } from "@/app/actions/news";
import { db } from "@/lib/db";

export const revalidate = 3600; // Cache for 1 hour, but admin can purge it instantly

export default async function Home() {
  const [savedGridSettings, clientProjects, latestNews, activeBanners] = await Promise.all([
    getSiteSetting("homepage_grid_categories"),
    db.clientProject.findMany({
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" }
      ],
      where: { isVisible: true }
    }),
    getLatestNews(4),
    db.banner.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" }
    })
  ]);

  let gridCategories: any[] = [];

  // Priority 1: Use specific Grid Settings if available
  if (savedGridSettings && Array.isArray(savedGridSettings) && savedGridSettings.length > 0) {
    // Normalize settings: Support both string[] (legacy) and {id, customName}[] (new)
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
            originalName: cat.name,
            // For explicitly selected grid items, we default to search unless we fetch slug/link in future
            link: undefined
          };
        })
        .filter(Boolean);
    }
  }

  // Fallback to empty if no grid settings
  if (gridCategories.length === 0) {
    gridCategories = [];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <HeroSlider banners={activeBanners} />
      <CategorySection categories={gridCategories} />
      <ClientPortfolioSection projects={clientProjects} />
      <PromoBanners />
      <NewsSection news={latestNews} />
      <Footer />
    </div>
  );
}
