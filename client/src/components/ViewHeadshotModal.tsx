import { useState } from 'react';
import { Download, RefreshCw, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { HeadshotItem } from './HeadshotGallery';
import { format } from 'date-fns';

interface ViewHeadshotModalProps {
  headshot: HeadshotItem;
  isOpen: boolean;
  onClose: () => void;
}

const ViewHeadshotModal = ({ headshot, isOpen, onClose }: ViewHeadshotModalProps) => {
  const { toast } = useToast();
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false);

  const handleDownloadFullSize = async () => {
    try {
      const response = await fetch(headshot.imageUrl);
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

  const handleGenerateSimilar = async () => {
    setIsGeneratingSimilar(true);
    
    try {
      // This would trigger a new generation with the same model and style
      toast({
        title: "Generation started",
        description: "Your new headshot is being generated. You'll be notified when it's ready."
      });
      
      // Simulate a delay
      setTimeout(() => {
        setIsGeneratingSimilar(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: "There was an error generating a similar headshot. Please try again.",
        variant: "destructive"
      });
      setIsGeneratingSimilar(false);
    }
  };

  const handleShareHeadshot = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${headshot.style} Headshot by Headshot AI`,
          text: `Check out my professional headshot created with Headshot AI`,
          url: headshot.imageUrl
        });
      } else {
        await navigator.clipboard.writeText(headshot.imageUrl);
        toast({
          title: "Link copied",
          description: "Headshot URL has been copied to your clipboard."
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Share failed",
        description: error instanceof Error ? error.message : "There was an error sharing the headshot.",
        variant: "destructive"
      });
    }
  };

  const formatCreatedDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM d, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  // Sample styles for the right panel
  const otherStyles = [
    { style: 'casual', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80' },
    { style: 'business', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80' },
    { style: 'creative', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden flex flex-col">
        <DialogHeader className="flex-row justify-between items-center p-4 border-b">
          <DialogTitle className="text-xl font-semibold">{headshot.style} Style Headshot</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="md:w-2/3 p-4 flex items-center justify-center bg-gray-100">
            <div className="relative w-full max-w-md h-auto flex items-center justify-center">
              <div className="w-full h-72 md:h-96 bg-gray-200 flex items-center justify-center">
                <svg 
                  className="w-16 h-16 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/3 p-4 overflow-y-auto border-t md:border-t-0 md:border-l">
            <div className="mb-6">
              <h4 className="font-medium mb-2">Headshot Details</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Style</span>
                  <span className="font-medium">{headshot.style}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Generated On</span>
                  <span className="font-medium">{formatCreatedDate(headshot.createdAt)}</span>
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
              <h4 className="font-medium mb-2">Actions</h4>
              <div className="space-y-2">
                <Button 
                  variant="default" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleDownloadFullSize}
                >
                  <Download className="h-4 w-4" />
                  <span>Download Full Size</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGenerateSimilar}
                  disabled={isGeneratingSimilar}
                >
                  <RefreshCw className={`h-4 w-4 ${isGeneratingSimilar ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingSimilar ? 'Generating...' : 'Generate Similar'}</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleShareHeadshot}
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Other Styles</h4>
              <div className="grid grid-cols-3 gap-2">
                {otherStyles.map((style, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-200 rounded-md cursor-pointer overflow-hidden"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-500 font-medium">{style.style}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewHeadshotModal;
