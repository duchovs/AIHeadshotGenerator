import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import LoginButton from "./LoginButton";

const Header = () => {
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/">
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
                <path d="M8.8 20v-4.1l1.9-.2c.6-.1 1.1-.3 1.6-.6.5-.3.9-.7 1.3-1.2.3-.5.5-1.1.5-1.9s-.2-1.4-.5-1.9c-.4-.5-.8-.9-1.3-1.2s-1-.5-1.6-.6L8.8 8.1V4h6.4v2H11c.5.1.9.2 1.2.4s.6.5.8.9c.2.4.3.9.3 1.4 0 .6-.1 1-.3 1.4-.2.4-.5.7-.8.9-.3.2-.7.4-1.2.4H11V20H8.8Z" />
              </svg>
              <span className="font-bold text-xl">Headshot AI</span>
            </div>
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link href="/">
              <span className={`font-medium cursor-pointer ${location === "/" ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}>Home</span>
            </Link>
            <Link href="/gallery">
              <span className={`font-medium cursor-pointer ${location === "/gallery" ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}>Gallery</span>
            </Link>
            <a href="#" className="font-medium text-gray-500 hover:text-gray-900">About</a>
            <a href="#" className="font-medium text-gray-500 hover:text-gray-900">Help</a>
          </nav>

          <div className="flex items-center space-x-4">
            <LoginButton />
            
            <div className="hidden sm:block">
              <Link href="/upload">
                <Button variant="outline">Get Started</Button>
              </Link>
            </div>
            
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
                  <Link href="/gallery">
                    <span className="font-medium text-gray-600 py-2 cursor-pointer">Gallery</span>
                  </Link>
                  <Link href="/upload">
                    <span className="font-medium text-gray-600 py-2 cursor-pointer">Get Started</span>
                  </Link>
                  <a href="#" className="font-medium text-gray-600 py-2">About</a>
                  <a href="#" className="font-medium text-gray-600 py-2">Help</a>
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
