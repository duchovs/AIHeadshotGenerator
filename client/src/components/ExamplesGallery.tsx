import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getStyleTags } from './HeadshotStyles';
import type { HeadshotItem } from './HeadshotGallery';

interface ExamplesGalleryProps {
  headshots: HeadshotItem[];
  title?: string;
  isLoading?: boolean;
}

const ExamplesGallery = ({
  headshots,
  title = "Example Headshots",
  isLoading = false
}: ExamplesGalleryProps) => {
  const [selectedExample, setSelectedExample] = useState<HeadshotItem | null>(null);
  const { toast } = useToast();

  // Handle view example
  const handleViewExample = (example: HeadshotItem) => {
    setSelectedExample(example);
  };

  // Handle close example view
  const handleCloseExample = () => {
    setSelectedExample(null);
  };

  // Handle download
  const handleDownload = async (example: HeadshotItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`/examples/${example.imageUrl}`);
      if (!response.ok) throw new Error('Failed to download image');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `example-${example.style}-${example.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Your example headshot is being downloaded."
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No examples state
  if (!headshots || headshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">
          <svg 
            className="h-12 w-12 text-gray-400 mx-auto" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h4 className="text-lg font-medium mb-2">No examples available</h4>
          <p className="text-gray-500 mb-4">Please check back later for example headshots.</p>
        </div>
      </div>
    );
  }

  // Selected example view
  if (selectedExample) {
    return (
      <div className="mb-10">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-2/3 p-4">
              <div className="relative w-full h-72 md:h-96 bg-gray-200">
                <img
                  src={`/examples/${selectedExample.imageUrl}`}
                  alt={`${selectedExample.style} style headshot example`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div className="w-full md:w-1/3 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{selectedExample.style} Style</h3>
                <Button variant="ghost" size="icon" onClick={handleCloseExample}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-2">Style Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {getStyleTags(selectedExample.style.toLowerCase()).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full mb-3" 
                onClick={(e) => handleDownload(selectedExample, e)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              
              <Button
                variant="outline" 
                className="w-full"
                onClick={handleCloseExample}
              >
                Back to Gallery
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main gallery view
  return (
    <div className="mb-10">
      <h3 className="text-xl font-semibold mb-6">{title}</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {headshots.map((example) => (
          <div 
            key={example.id} 
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewExample(example)}
          >
            <div className="relative">
              <div className="relative w-full h-72 bg-gray-200">
                <img
                  src={`/examples/${example.imageUrl}`}
                  alt={`${example.style} style headshot example`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loop
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCAxNmw0LjU4Ni00LjU4NmEyIDIgMCAwMTIuODI4IDBMMTYgMTZtLTItMmwxLjU4Ni0xLjU4NmEyIDIgMCAwMTIuODI4IDBMMjAgMTRtLTYtNmguMDFNNiAyMGgxMmEyIDIgMCAwMDItMlY2YTIgMiAwIDAwLTItMkg2YTIgMiAwIDAwLTIgMnYxMmEyIDIgMCAwMDIgMnoiIHN0cm9rZT0iI2E0YTRhNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==';
                  }}
                />
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">{example.style} Style</h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {getStyleTags(example.style.toLowerCase()).slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                    {tag}
                  </Badge>
                ))}
                {getStyleTags(example.style.toLowerCase()).length > 3 && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                    +{getStyleTags(example.style.toLowerCase()).length - 3} more
                  </Badge>
                )}
              <Button 
                variant="ghost" 
                className="absolute inset-0 w-0 h-0 opacity-0"
                onClick={() => handleViewExample(example)}
              >
              </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamplesGallery;
