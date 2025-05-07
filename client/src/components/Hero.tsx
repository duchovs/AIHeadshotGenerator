import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ExamplesModal from "./ExamplesModal";

const Hero = () => {
  const [showExamples, setShowExamples] = useState(false);
  return (
    <>
      <section className="bg-gradient-to-br from-primary to-[#6366F1] text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Professional AI Headshots in Minutes
              </h1>
              <p className="text-lg md:text-xl opacity-90 mb-6">
                Upload your photos and let our AI create stunning professional headshots in various styles.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/upload">
                  <Button size="lg" variant="secondary" className="bg-transparent border border-white text-white font-medium hover:bg-white hover:bg-opacity-10">
                    Start Creating
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-transparent border border-white text-white font-medium hover:bg-white hover:bg-opacity-10"
                  onClick={() => setShowExamples(true)}
                >
                  View Examples
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                <div className="rounded-md shadow-lg transform -rotate-3 bg-white/20 backdrop-blur-sm h-36 md:h-44 overflow-hidden">
                  <svg className="w-full h-full text-white/40" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect width="100%" height="100%" fill="currentColor" />
                  </svg>
                </div>
                <div className="rounded-md shadow-lg transform rotate-3 translate-y-4 bg-white/20 backdrop-blur-sm h-36 md:h-44 overflow-hidden">
                  <svg className="w-full h-full text-white/40" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect width="100%" height="100%" fill="currentColor" />
                  </svg>
                </div>
                <div className="rounded-md shadow-lg transform rotate-3 bg-white/20 backdrop-blur-sm h-36 md:h-44 overflow-hidden">
                  <svg className="w-full h-full text-white/40" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect width="100%" height="100%" fill="currentColor" />
                  </svg>
                </div>
                <div className="rounded-md shadow-lg transform -rotate-3 translate-y-4 bg-white/20 backdrop-blur-sm h-36 md:h-44 overflow-hidden">
                  <svg className="w-full h-full text-white/40" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect width="100%" height="100%" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {showExamples && (
        <ExamplesModal
          isOpen={showExamples}
          onClose={() => setShowExamples(false)}
        />
      )}
    </>
  );
};

export default Hero;
