import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import StepIndicator from '@/components/StepIndicator';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const Train = () => {
  const { modelId } = useParams();
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds
  const [, setLocation] = useLocation();
  
  const modelIdInt = modelId ? parseInt(modelId) : undefined;
  
  interface ModelData {
    id: number;
    userId: number;
    replicateModelId: string;
    status: 'training' | 'completed' | 'failed' | 'canceled';
    message?: string;
    error?: string;
  }

  const { data: model, isLoading } = useQuery({
    queryKey: ['/api/models', modelIdInt],
    queryFn: async (): Promise<ModelData | null> => {
      if (!modelIdInt) return null;
      const response = await fetch(`/api/models/${modelIdInt}`);
      if (!response.ok) throw new Error('Failed to fetch model');
      return response.json();
    },
    enabled: !!modelIdInt,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    select: (data: ModelData | null) => data,
    staleTime: 0
  });

  useEffect(() => {
    if (!modelIdInt) {
      // Redirect to upload if no model ID is provided
      setLocation('/upload');
      return;
    }
    
    if (model?.status === 'completed') {
      // Navigate to generate when training is complete
      setLocation(`/generate/${modelIdInt}`);
    } else if (model?.status === 'training') {
      // Navigate to train when training is in progress
      setLocation(`/train/${modelIdInt}`);
    } else if (model?.status === 'failed') {
      // Navigate back to upload with error when training fails
      setLocation('/upload?error=' + encodeURIComponent(model.message || 'Training failed'));
    } else if (model?.status === 'canceled') {
      // Navigate back to upload with error when training fails
      setLocation('/upload?error=' + encodeURIComponent(model.message || 'Training canceled'));
    }
  }, [modelIdInt, model, setLocation]);

  // Update progress based on model data
  useEffect(() => {
    if (!modelIdInt || model?.status === 'completed' || model?.status === 'failed' || model?.status === 'canceled') return;
    
    // Use actual progress from model, or keep current progress if not available
    if (model?.progress !== undefined) {
      setProgress(model.progress);
    }
    
    // Update time remaining based on progress
    if (model?.progress !== undefined) {
      const estimatedTotalTime = 1200; // 20 minutes in seconds
      const remainingTime = Math.ceil((100 - model.progress) / 100 * estimatedTotalTime);
      setTimeRemaining(remainingTime);
    }
  }, [modelIdInt, model]);
  
  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <StepIndicator currentStep="train" modelId={modelIdInt} />
      
      <Card className="mb-10">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold mb-2">Training Your AI Model</h3>
            <p className="text-gray-600">
              We are training your personalized AI model. This process will take 15-20 minutes.
            </p>
            <p className="text-gray-600">
              You can navigate away from this page. We will send you an email when training is complete.
            </p>
          </div>
          
          <div className="max-w-md mx-auto mb-8">
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium">Training Progress</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Estimated time remaining: {formatTimeRemaining()}
              </p>
            </div>
          </div>
          
          {model?.status === 'failed' ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md mx-auto mb-8">
              <h4 className="font-medium text-red-800 mb-2">Training Failed</h4>
              <p className="text-sm text-red-700">
                {model.message || 'An error occurred during training. Please try again.'}
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 max-w-md mx-auto mb-8">
              <h4 className="font-medium text-yellow-800 mb-2">Training in Progress</h4>
              <p className="text-sm text-yellow-700">
                The progress bar takes a couple of minutes to start. You will be automatically redirected when training is complete.
              </p>
            </div>
          )}
          
          <div className="text-center">
            <Button 
              disabled={model?.status !== 'failed'}
              className="min-w-[200px]"
              onClick={() => setLocation('/upload')}
            >
              {model?.status === 'failed' ? (
                'Try Again'
              ) : (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Training in Progress
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Train;
