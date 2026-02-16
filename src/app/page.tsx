import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import HeroSlider from "@/components/home/HeroSlider";
import CategorySection from "@/components/home/CategorySection";
import PromoBanners from "@/components/home/PromoBanners";
import NewsSection from "@/components/home/NewsSection";
import ClientPortfolioSection from "@/components/home/ClientPortfolioSection";

import { getSiteSetting } from "@/app/actions/settings";
import { getLatestNews } from "@/app/actions/news";
import { db } from "@/lib/db";

export default async function Home() {
  const [savedGridSettings, menuConfig, clientProjects, latestNews] = await Promise.all([
    getSiteSetting("homepage_grid_categories"),
    getSiteSetting("category_menu_config"),
    db.clientProject.findMany({
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" }
      ],
      where: { isVisible: true }
    }),
    getLatestNews(4)
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

  // Priority 2: Fallback to Menu Configuration
  if (gridCategories.length === 0 && menuConfig && Array.isArray(menuConfig)) {
    // Map menu config items to grid format
    // Menu item structure: { id, name, alias, icon, link, categoryId, ... }
    gridCategories = menuConfig.map((item: any) => ({
      id: item.categoryId || item.id,
      name: item.alias || item.name, // Display name: Alias preferred for brevity
      originalName: item.name,      // Search keyword: Original name preferred
      image: item.icon,
      link: item.link
    }));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <HeroSlider />
      <CategorySection categories={gridCategories} />
      <ClientPortfolioSection projects={clientProjects} />
      <PromoBanners />
      <NewsSection news={latestNews} />
      <Footer />
    </div>
  );
}
