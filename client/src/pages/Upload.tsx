import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import FileUploader from '@/components/FileUploader';
import UploadedPhotos from '@/components/UploadedPhotos';
import StepIndicator from '@/components/StepIndicator';
import TrainingModal from '@/components/TrainingModal';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface UploadedPhoto {
  id: number;
  filename: string;
  path: string;
}

const Upload = () => {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [error, setError] = useState<{ name: string; message: string } | null>(null);

  // Get error from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error');
    if (errorMsg) {
      setError({ name: 'Training Failed', message: decodeURIComponent(errorMsg) });
      // Clear the error from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['/api/uploads'],
    queryFn: async () => {
      const response = await fetch('/api/uploads');
      if (response.status === 401) throw Object.assign(new Error('Please log in before uploading your photos.'), { name: 'Unauthorized' });
      if (!response.ok) throw Object.assign(new Error('Failed to fetch uploads'), { name: 'Error' });
      return response.json();
    }
  });

  useEffect(() => {
    if (queryError) {
      setError({
        name: queryError.name || 'Training Failed',
        message: queryError.message || String(queryError),
      });
    }
  }, [queryError]);

  useEffect(() => {
    if (data) {
      setPhotos(data);
    }
  }, [data]);

  const handleUploadComplete = (uploadedPhotos: UploadedPhoto[]) => {
    setPhotos(prev => [...prev, ...uploadedPhotos]);
  };

  const handlePhotoDeleted = (photoId: number) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleClearAll = () => {
    setPhotos([]);
  };

  const handleProceedToTraining = () => {
    if (photos.length === 0) {
      return;
    }
    setIsTrainingModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <StepIndicator currentStep="upload" />
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h4 className="font-medium text-red-800 mb-2">{error.name}</h4>
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      )}
      
      <Card className="mb-10">
        <CardContent className="pt-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Upload Your Photos</h3>
            <p className="text-gray-600">Upload 10-20 clear photos of yourself for best results. Include different angles and expressions.</p>
          </div>
          
          <FileUploader onUploadComplete={handleUploadComplete} />
          
          {photos.length > 0 && (
            <UploadedPhotos 
              photos={photos} 
              onPhotoDeleted={handlePhotoDeleted} 
              onClearAll={handleClearAll} 
            />
          )}
          
          <div className="mt-8">
            <Button 
              onClick={handleProceedToTraining}
              disabled={photos.length === 0}
              className="w-full sm:w-auto"
            >
              Proceed to Training
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <TrainingModal 
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        photoCount={photos.length}
        photoIds={photos.map(photo => photo.id)}
      />
    </div>
  );
};

export default Upload;
