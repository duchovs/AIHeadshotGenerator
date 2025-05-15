import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import LoginButton from "./LoginButton";
import { useQuery } from '@tanstack/react-query';
import TokenBalance from './TokenBalance';

const Header = () => {
  const [location] = useLocation();
  const { data: models, isError } = useQuery({
    queryKey: ['/api/models'],
    queryFn: async () => {
      const res = await fetch('/api/models');
      if (!res.ok) throw new Error('Failed to fetch models');
      return res.json();
    }
  });
  // User is logged in if models is an array (fetch succeeded and not 401)
  const isLoggedIn = Array.isArray(models);

  const completedModel = models
    ? models
        .filter((m: any) => m.status === 'completed')
        .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
    : null;

  const trainingModel = models
    ? models
        .filter((m: any) => m.status === 'training')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/landing">
            <div className="flex items-center space-x-2 cursor-pointer">
              <svg 
                viewBox="0 0 24 24" 
                width="24" 
                height="24" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-primary"
              >
                <path d="M19 6h-1.586l-1-1c-.579-.579-1.595-1-2.414-1h-4c-.819 0-1.835.421-2.414 1l-1 1h-1.586c-1.654 0-3 1.346-3 3v8c0 1.654 1.346 3 3 3h14c1.654 0 3-1.346 3-3v-8c0-1.654-1.346-3-3-3zm-7 10c-1.933 0-3.5-1.568-3.5-3.5 0-1.934 1.567-3.5 3.5-3.5s3.5 1.566 3.5 3.5c0 1.932-1.567 3.5-3.5 3.5zm6-4.701c-.719 0-1.3-.58-1.3-1.299s.581-1.301 1.3-1.301 1.3.582 1.3 1.301-.581 1.299-1.3 1.299z"/>
              </svg>
              <span className="font-bold text-xl">Headshot AI</span>
            </div>
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link href="/">
              <span className={`font-medium cursor-pointer ${location === "/" ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}>Home</span>
            </Link>
            <Link href={isLoggedIn ? `/train/${trainingModel?.id}` : "/login"}>
              <span className={`font-medium cursor-pointer ${location === (isLoggedIn ? `/train/${trainingModel?.id}` : "/login") ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}>Upload</span>
            </Link>
            {completedModel?.id ? (
              <Link href={`/generate/${completedModel.id}`}>
                <span className={`font-medium cursor-pointer ${location === `/generate/${completedModel.id}` ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}>Generate</span>
              </Link>
            ) : (
              <span className="font-medium cursor-not-allowed text-gray-400">Generate</span>
            )}
            <Link href="/gallery">
              <span className={`font-medium cursor-pointer ${location === "/gallery" ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}>Gallery</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/tokens">
              <div className="flex items-center space-x-1 hover:text-primary cursor-pointer">
                <TokenBalance />
                <span className="text-sm text-gray-500">Buy Tokens</span>
              </div>
            </Link>
            <LoginButton />
            {/*}
            <div className="hidden sm:block">
              <Link href={isLoggedIn ? "/upload" : "/login"}>
                <Button variant="outline">Get Started</Button>
              </Link>
            </div>
            */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col space-y-4 mt-8">
                  <Link href="/">
                    <span className="font-medium text-gray-900 py-2 cursor-pointer">Home</span>
                  </Link>
                  <Link href={isLoggedIn ? `/train/${trainingModel?.id}` : "/login"}>
                    <span className="font-medium text-gray-600 py-2 cursor-pointer">Upload</span>
                  </Link>
                  <Link href={`/generate/${completedModel?.id}`}>
                    <span className="font-medium text-gray-600 py-2 cursor-pointer">Generate</span>
                  </Link>
                  <Link href="/gallery">
                    <span className="font-medium text-gray-600 py-2 cursor-pointer">Gallery</span>
                  </Link>
                  <Link href="/tokens">
                    <span className="font-medium text-gray-600 py-2 cursor-pointer">Buy Tokens</span>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
