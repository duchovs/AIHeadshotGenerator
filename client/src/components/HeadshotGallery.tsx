import { useState } from 'react';
import { getStyleTags } from './HeadshotStyles';
import { Heart, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import ViewHeadshotModal from './ViewHeadshotModal';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Link } from "wouter";


export interface HeadshotItem {
  id: number;
  style: string;
  filePath: string;
  imageUrl: string;
  createdAt: string | Date;
  favorite: boolean;
  modelId: number;
}

interface HeadshotGalleryProps {
  headshots: HeadshotItem[];
  title?: string;
  showViewAll?: boolean;
  isLoading?: boolean;
}

const HeadshotGallery = ({ 
  headshots, 
  title = "Your Previous Headshots", 
  showViewAll = true,
  isLoading = false
}: HeadshotGalleryProps) => {
  const [selectedHeadshot, setSelectedHeadshot] = useState<HeadshotItem | null>(null);
  const { toast } = useToast();

  const handleViewHeadshot = (headshot: HeadshotItem) => {
    setSelectedHeadshot(headshot);
  };

  const handleDownload = async (headshot: HeadshotItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/headshots/${headshot.id}/image`);
      if (!response.ok) throw new Error('Failed to download image');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `headshot-${headshot.style}-${headshot.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Your headshot is being downloaded."
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the headshot. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleFavorite = async (headshot: HeadshotItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await apiRequest('PATCH', `/api/headshots/${headshot.id}/favorite`, undefined);
      
      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }
      
      // Invalidate the headshots query
      queryClient.invalidateQueries({ queryKey: ['/api/headshots'] });
      
      toast({
        title: headshot.favorite ? "Removed from favorites" : "Added to favorites",
        description: `Headshot has been ${headshot.favorite ? 'removed from' : 'added to'} your favorites.`
      });
    } catch (error) {
      console.error('Favorite toggle error:', error);
      toast({
        title: "Action failed",
        description: "There was an error updating the favorite status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  if (isLoading) {
    return (
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">{title}</h3>
          {showViewAll && <div className="w-16 h-4 bg-gray-200 animate-pulse rounded"></div>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-4">
                <div className="w-2/3 h-5 bg-gray-200 animate-pulse mb-2 rounded"></div>
                <div className="flex space-x-2 mb-3">
                  <div className="w-24 h-6 bg-gray-200 animate-pulse rounded-full"></div>
                  <div className="w-20 h-6 bg-gray-200 animate-pulse rounded-full"></div>
                </div>
                <div className="flex justify-between">
                  <div className="w-12 h-4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (headshots.length === 0) {
    return (
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <svg 
            className="w-16 h-16 mx-auto mb-4 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h4 className="text-lg font-medium mb-2">No headshots yet</h4>
          <p className="text-gray-500 mb-4">Generate your first headshots to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        {showViewAll && (
          <Link href="/gallery">
          <Button variant="link" className="text-primary hover:text-primary-600 text-sm font-medium">
            View All
          </Button>
        </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {headshots.map((headshot) => (
          <div 
            key={headshot.id} 
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewHeadshot(headshot)}
          >
            <div className="relative">
              <div className="relative w-full h-48 bg-gray-200">
                <img
                  src={`/api/headshots/${headshot.id}/image`}
                  alt={`${headshot.style} style headshot`}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loop
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCAxNmw0LjU4Ni00LjU4NmEyIDIgMCAwMTIuODI4IDBMMTYgMTZtLTItMmwxLjU4Ni0xLjU4NmEyIDIgMCAwMTIuODI4IDBMMjAgMTRtLTYtNmguMDFNNiAyMGgxMmEyIDIgMCAwMDItMlY2YTIgMiAwIDAwLTItMkg2YTIgMiAwIDAwLTIgMnYxMmEyIDIgMCAwMDIgMnoiIHN0cm9rZT0iI2E0YTRhNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==';
                  }}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow h-8 w-8"
                onClick={(e) => toggleFavorite(headshot, e)}
              >
                <Heart className={`h-4 w-4 ${headshot.favorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
              </Button>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">{headshot.style} Style</h4>
                <span className="text-xs text-gray-500">{formatDate(headshot.createdAt)}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {getStyleTags(headshot.style).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="link" className="text-primary hover:text-primary-600 p-0 h-auto text-sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button 
                  variant="link" 
                  className="text-gray-500 hover:text-gray-700 p-0 h-auto text-sm"
                  onClick={(e) => handleDownload(headshot, e)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedHeadshot && (
        <ViewHeadshotModal
          headshot={selectedHeadshot}
          isOpen={!!selectedHeadshot}
          onClose={() => setSelectedHeadshot(null)}
        />
      )}
    </div>
  );
};

export default HeadshotGallery;
