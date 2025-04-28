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

  const { data, isLoading } = useQuery({
    queryKey: ['/api/uploads'],
    queryFn: async () => {
      const response = await fetch('/api/uploads');
      if (!response.ok) throw new Error('Failed to fetch uploads');
      return response.json();
    }
  });

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
