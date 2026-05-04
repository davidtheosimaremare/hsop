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
const ProductGridSection = dynamic(() => import("@/components/home/ProductGridSection"), {
  loading: () => <div className="h-64 animate-pulse bg-gray-100" />
});

import { getSiteSetting } from "@/app/actions/settings";
import { getLatestNews } from "@/app/actions/news";
import { db } from "@/lib/db";
import { memoryCache } from "@/lib/cache";

// Cache homepage data via in-memory cache
function getClientProjects() {
    return memoryCache.getOrFetch('client-projects', () =>
        db.clientProject.findMany({
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
            where: { isVisible: true }
        }),
        3600
    );
}

function getActiveBanners() {
    return memoryCache.getOrFetch('active-banners', () =>
        db.banner.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" }
        }),
        3600
    );
}

function getReadyStockProtection() {
    return memoryCache.getOrFetch('ready-stock-protection', () =>
        db.product.findMany({
            where: { 
                availableToSell: { gt: 0 },
                isVisible: true,
                OR: [
                    { category: { contains: 'MCB', mode: 'insensitive' } },
                    { category: { contains: 'MCCB', mode: 'insensitive' } },
                    { category: { contains: 'ACB', mode: 'insensitive' } },
                    { category: { contains: 'RCBO', mode: 'insensitive' } },
                    { category: { contains: 'Proteksi', mode: 'insensitive' } }
                ]
            },
            take: 10,
            orderBy: { availableToSell: 'desc' }
        }),
        1800
    );
}

function getReadyStockControl() {
    return memoryCache.getOrFetch('ready-stock-control', () =>
        db.product.findMany({
            where: { 
                availableToSell: { gt: 0 },
                isVisible: true,
                OR: [
                    { category: { contains: 'Contactor', mode: 'insensitive' } },
                    { category: { contains: 'Relay', mode: 'insensitive' } },
                    { category: { contains: 'Inverter', mode: 'insensitive' } },
                    { category: { contains: 'VSD', mode: 'insensitive' } },
                    { category: { contains: 'Soft Starter', mode: 'insensitive' } },
                    { category: { contains: 'PLC', mode: 'insensitive' } },
                    { category: { contains: 'Kontrol', mode: 'insensitive' } }
                ]
            },
            take: 10,
            orderBy: { availableToSell: 'desc' }
        }),
        1800
    );
}

function getReadyStockLighting() {
    return memoryCache.getOrFetch('ready-stock-lighting', () =>
        db.product.findMany({
            where: { 
                availableToSell: { gt: 0 },
                isVisible: true,
                OR: [
                    { category: { contains: 'Lampu', mode: 'insensitive' } },
                    { category: { contains: 'LED', mode: 'insensitive' } },
                    { category: { contains: 'Lighting', mode: 'insensitive' } },
                    { brand: { contains: 'Philips', mode: 'insensitive' } }
                ]
            },
            take: 10,
            orderBy: { availableToSell: 'desc' }
        }),
        1800
    );
}

export default async function Home() {
  // Fetch everything in one go
  const [
    savedGridSettings, 
    clientProjects, 
    latestNews, 
    activeBanners, 
    companyDetails, 
    rsProtection, 
    rsControl, 
    rsLighting,
    protectionBanner,
    controlBanner,
    lightingBanner
  ] = await Promise.all([
    getSiteSetting("homepage_grid_categories"),
    getClientProjects(),
    getLatestNews(4),
    getActiveBanners(),
    getSiteSetting("company_details") as Promise<any>,
    getReadyStockProtection(),
    getReadyStockControl(),
    getReadyStockLighting(),
    getSiteSetting("homepage_banner_protection"),
    getSiteSetting("homepage_banner_control"),
    getSiteSetting("homepage_banner_lighting")
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

  // === JSON-LD Structured Data for Google ===
  const siteName = companyDetails?.siteTitle || companyDetails?.name || "Hokiindoshop";
  const siteDescription = companyDetails?.description || "Distributor resmi produk Siemens Electrical Indonesia. Jual MCB, MCCB, ACB, Contactor, VSD dan peralatan listrik berkualitas tinggi.";
  
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: 'https://shop.hokiindo.co.id',
    logo: 'https://shop.hokiindo.co.id/logo-H.png',
    description: siteDescription,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: companyDetails?.phone || '+62-21-385-7057',
      contactType: 'sales',
      areaServed: 'ID',
      availableLanguage: 'Indonesian',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: companyDetails?.address || 'Jl. Cideng Timur No. 66',
      addressLocality: 'Jakarta Pusat',
      addressRegion: 'DKI Jakarta',
      addressCountry: 'ID',
    },
    sameAs: [
      companyDetails?.instagram ? `https://instagram.com/${companyDetails.instagram.replace('@', '')}` : null,
      companyDetails?.facebook || null,
      companyDetails?.linkedin || null,
    ].filter(Boolean),
  };

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: 'https://shop.hokiindo.co.id',
    description: siteDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://shop.hokiindo.co.id/pencarian?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <SiteHeader />
      <HeroSlider banners={activeBanners} />
      <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>}>
        <CategorySection categories={gridCategories} title="Kategori Utama" hideViewAll={false} />
        
        <div className="bg-gray-50 pb-12">
            <ProductGridSection 
                title="Protection" 
                subtitle="MCB, MCCB, ACB, RCBO & Electrical Protection"
                viewAllLink="/pencarian?q=mcb" 
                products={rsProtection} 
                bannerImage={protectionBanner}
            />
            <ProductGridSection 
                title="Control Product" 
                subtitle="Contactor, Relay, Inverter, VSD, Soft Starter & PLC"
                viewAllLink="/pencarian?q=contactor" 
                products={rsControl} 
                bannerImage={controlBanner}
            />
            <ProductGridSection 
                title="Lampu & Tata Cahaya" 
                subtitle="Philips LED, Downlight, Tube & Industrial Lighting"
                viewAllLink="/pencarian?q=lampu" 
                products={rsLighting} 
                bannerImage={lightingBanner}
            />
        </div>
        
        <PromoBanners />
        <ClientPortfolioSection projects={clientProjects} />
        <NewsSection news={latestNews} />
      </Suspense>
      <Footer />
    </div>
  );
}

