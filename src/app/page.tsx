import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSlider from "@/components/home/HeroSlider";
import CategorySection from "@/components/home/CategorySection";
import DistributionSection from "@/components/home/DistributionSection";
import PromoBanners from "@/components/home/PromoBanners";
import NewsSection from "@/components/home/NewsSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroSlider />
      <CategorySection />
      <DistributionSection />
      <PromoBanners />
      <NewsSection />
      <Footer />
    </div>
  );
}

