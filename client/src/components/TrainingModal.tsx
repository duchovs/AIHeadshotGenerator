import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoCount: number;
  photoIds: number[];
}

const TrainingModal = ({ isOpen, onClose, photoCount, photoIds }: TrainingModalProps) => {
  const [isPrivacyConsented, setIsPrivacyConsented] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleStartTraining = async () => {
    if (!isPrivacyConsented) {
      toast({
        title: "Privacy consent required",
        description: "Please accept the privacy terms to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsTraining(true);

    try {
      const response = await apiRequest('POST', '/api/models/train', { photoIds });
      
      if (!response.ok) {
        throw new Error('Training failed to start');
      }
      
      const data = await response.json();
      
      toast({
        title: "Training started",
        description: "Your AI model is now being trained. This may take 15-20 minutes."
      });
      
      onClose();
      setLocation(`/train/${data.id}`);
    } catch (error) {
      console.error('Training error:', error);
      toast({
        title: "Training failed",
        description: "There was an error starting the training process. Please try again.",
        variant: "destructive"
      });
      setIsTraining(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Training Your AI Model</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        
        <div className="mb-6">
          <DialogDescription className="text-gray-600 mb-4">
            We'll now train an AI model specifically for your face. This process typically takes 15-20 minutes.
          </DialogDescription>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Training Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Photos Uploaded</p>
                <p className="font-medium">{photoCount} photos</p>
              </div>
              <div>
                <p className="text-gray-500">Estimated Time</p>
                <p className="font-medium">15-20 minutes</p>
              </div>
              <div>
                <p className="text-gray-500">Model Type</p>
                <p className="font-medium">Professional Headshot v2</p>
              </div>
              <div>
                <p className="text-gray-500">Available Styles</p>
                <p className="font-medium">All (6 styles)</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium mb-3">Training Privacy</h4>
          <div className="flex items-start gap-2">
            <Checkbox 
              id="privacy-consent" 
              checked={isPrivacyConsented}
              onCheckedChange={(checked) => setIsPrivacyConsented(checked === true)}
            />
            <Label htmlFor="privacy-consent" className="text-sm text-gray-600">
              I understand that my photos will be temporarily stored to train my custom AI model. All photos will be deleted after training is complete. See our <a href="#" className="text-primary hover:text-primary-600">Privacy Policy</a> for details.
            </Label>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isTraining}>
            Cancel
          </Button>
          <Button onClick={handleStartTraining} disabled={isTraining || !isPrivacyConsented}>
            {isTraining ? 'Starting Training...' : 'Start Training'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingModal;
