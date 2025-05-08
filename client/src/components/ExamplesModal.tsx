import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import { getStyleTags } from './HeadshotStyles';

// Mock data for examples
const EXAMPLE_HEADSHOTS = [
  {
    id: 6,
    fileName: 'headshot_6.png',
    style: 'Artistic',
    tags: getStyleTags('artistic')
  },
  {
    id: 11,
    fileName: 'headshot_11.png',
    style: 'Fantasy',
    tags: getStyleTags('fantasy')
  },
  {
    id: 12,
    fileName: 'headshot_12.png',
    style: 'Corporate',
    tags: getStyleTags('corporate')
  },
  {
    id: 26,
    fileName: 'headshot_26.png',
    style: 'Artistic',
    tags: getStyleTags('artistic')
  },
  {
    id: 20,
    fileName: 'headshot_20.png',
    style: 'Fantasy',
    tags: getStyleTags('fantasy')
  },
  {
    id: 5,
    fileName: 'headshot_5.png',
    style: 'Corporate',
    tags: getStyleTags('corporate')
  }
];

interface ExampleHeadshot {
  id: number;
  fileName: string;
  style: string;
  tags: string[];
}

interface ExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExamplesModal = ({ isOpen, onClose }: ExamplesModalProps) => {
  const { toast } = useToast();
  const [selectedExample, setSelectedExample] = useState<ExampleHeadshot | null>(null);

  const handleDownload = async (example: ExampleHeadshot) => {
    try {
      const response = await fetch(`/examples/${example.fileName}`);
      if (!response.ok) throw new Error('Failed to download image');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = example.fileName;
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
        description: "There was an error downloading the example. Please try again.",
        variant: "destructive"
      });
    }
  };

  // View full size example
  const handleViewExample = (example: ExampleHeadshot) => {
    setSelectedExample(example);
  };

  // Back to gallery from detailed view
  const handleBackToGallery = () => {
    setSelectedExample(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden flex flex-col">
        <DialogHeader className="flex-row justify-between items-center p-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            {selectedExample ? `${selectedExample.style} Style Example` : 'Headshot AI Examples'}
          </DialogTitle>
        </DialogHeader>
        
        {selectedExample ? (
          // Detailed view of selected example
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            <div className="md:w-2/3 p-4 flex items-center justify-center bg-gray-100">
              <div className="relative w-full max-w-md h-auto flex items-center justify-center">
                <div className="w-full h-72 md:h-96 bg-gray-200 relative">
                  <img
                    src={`/examples/${selectedExample.fileName}`}
                    alt={`${selectedExample.style} style headshot example`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
            
            <div className="md:w-1/3 p-4 overflow-y-auto border-t md:border-t-0 md:border-l">
              <div className="mb-6">
                <h4 className="font-medium mb-2">Headshot Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Style</span>
                    <span className="font-medium">{selectedExample.style}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Resolution</span>
                    <span className="font-medium">1024 × 1024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Format</span>
                    <span className="font-medium">PNG</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-2">Style Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedExample.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  variant="default" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => handleDownload(selectedExample)}
                >
                  <Download className="h-4 w-4" />
                  <span>Download Example</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleBackToGallery}
                >
                  Back to Examples
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Gallery view
          <div className="relative p-4 overflow-y-auto">
            <DialogClose>
              <X className="h-4 w-4 right-4 top-4 absolute md:hidden" />
            </DialogClose>
            <p className="text-gray-600 mb-4">Browse our collection of AI-generated professional headshots in various styles.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXAMPLE_HEADSHOTS.map((example) => (
                <div 
                  key={example.id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewExample(example)}
                >
                  <div className="relative">
                    <div className="relative w-full h-48 bg-gray-200">
                      <img
                        src={`/examples/${example.fileName}`}
                        alt={`${example.style} style headshot example`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">{example.style} Style</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {example.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <Button 
                        variant="link" 
                        className="text-primary hover:text-primary-600 p-0 h-auto text-sm"
                      >
                        View
                      </Button>
                      <Button 
                        variant="link" 
                        className="text-gray-500 hover:text-gray-700 p-0 h-auto text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(example);
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExamplesModal;
