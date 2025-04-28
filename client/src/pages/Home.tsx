import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Hero from "@/components/Hero";
import HeadshotGallery from "@/components/HeadshotGallery";
import FeatureSection from "@/components/FeatureSection";
import HeadshotStyles from "@/components/HeadshotStyles";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const Home = () => {
  const [headshots, setHeadshots] = useState([]);
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/headshots'],
    queryFn: async () => {
      // Add limit=4 to only get the most recent headshots
      const response = await fetch('/api/headshots?limit=4');
      if (!response.ok) throw new Error('Failed to fetch headshots');
      return response.json();
    }
  });
  
  useEffect(() => {
    if (data) {
      setHeadshots(data);
    }
  }, [data]);

  return (
    <div>
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <HeadshotGallery headshots={headshots} isLoading={isLoading} />
        
        <FeatureSection />
        
        <HeadshotStyles />
        
        <div className="text-center my-16">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Your Professional Headshots?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Get started in minutes and see how our AI can transform your photos into stunning professional headshots.
          </p>
          <Link href="/upload">
            <Button size="lg" className="px-8">
              Start Creating Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
