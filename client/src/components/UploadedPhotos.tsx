import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UploadedPhoto {
  id: number;
  filename: string;
  path: string;
}

interface UploadedPhotosProps {
  photos: UploadedPhoto[];
  onPhotoDeleted: (photoId: number) => void;
  onClearAll: () => void;
}

const UploadedPhotos = ({ photos, onPhotoDeleted, onClearAll }: UploadedPhotosProps) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeletePhoto = async (id: number) => {
    try {
      setDeletingId(id);
      const response = await apiRequest('DELETE', `/api/uploads/${id}`, undefined);
      
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
      
      onPhotoDeleted(id);
      
      toast({
        title: "Photo deleted",
        description: "Photo has been removed successfully."
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      const deletePromises = photos.map(photo => 
        apiRequest('DELETE', `/api/uploads/${photo.id}`, undefined)
      );
      await Promise.all(deletePromises);
      
      onClearAll();
      
      toast({
        title: "All photos deleted",
        description: "All photos have been removed successfully."
      });
    } catch (error) {
      console.error('Error clearing photos:', error);
      toast({
        title: "Clear failed",
        description: "There was an error clearing the photos. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Uploaded Photos ({photos.length})</h4>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary-600">
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all the photos you've uploaded. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll}>Delete All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {photos.map(photo => (
          <div key={photo.id} className="relative group">
            <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden">
              <svg 
                className="h-12 w-12 text-gray-400" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 rounded-md flex items-center justify-center transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-red-300 transition"
                onClick={() => handleDeletePhoto(photo.id)}
                disabled={deletingId === photo.id}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs mt-1 truncate text-center">{photo.filename}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadedPhotos;
