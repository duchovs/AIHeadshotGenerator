import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel, 
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import StepIndicator from '@/components/StepIndicator';
import HeadshotStyles, { stylePrompts } from '@/components/HeadshotStyles';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

const generateFormSchema = z.object({
  prompt: z.string().optional(),
});

type GenerateFormValues = z.infer<typeof generateFormSchema>;

import HeadshotGallery, { HeadshotItem } from '@/components/HeadshotGallery';

const Generate = () => {
  const { modelId } = useParams();
  const [, setLocation] = useLocation();
  const [selectedStyle, setSelectedStyle] = useState('Corporate');
  const [selectedGender, setSelectedGender] = useState('male')
  const { toast } = useToast();
  
  const modelIdInt = modelId ? parseInt(modelId) : undefined;

  // State for recent headshots
  const [recentHeadshots, setRecentHeadshots] = useState<HeadshotItem[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState<boolean>(true);
  
  const form = useForm<GenerateFormValues>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      prompt: '',
    },
  });
  
  const { data: model, isLoading: isModelLoading } = useQuery({
    queryKey: ['/api/models', modelIdInt],
    queryFn: async () => {
      if (!modelIdInt) return null;
      const response = await fetch(`/api/models/${modelIdInt}`);
      if (!response.ok) throw new Error('Failed to fetch model');
      return response.json();
    },
    enabled: !!modelIdInt,
  });
  
  useEffect(() => {
    if (!modelIdInt) {
      // Redirect to upload if no model ID is provided
      setLocation('/upload');
      return;
    }
    
    if (model && model.status !== 'completed') {
      // Redirect to train if model is not yet complete
      setLocation(`/train/${modelIdInt}`);
    }
  }, [modelIdInt, model, setLocation]);

  const generateMutation = useMutation({
    mutationFn: async (values: GenerateFormValues) => {
      const response = await fetch('/api/headshots/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: modelIdInt,
          style: selectedStyle,
          prompt: values.prompt,
          gender: selectedGender as 'male' | 'female',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate headshot');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Headshot generated',
        description: 'Your new headshot has been generated successfully.',
      });
      
      // Invalidate headshots query to refresh the gallery
      queryClient.invalidateQueries({ queryKey: ['/api/headshots'] });
      
      // Reset the form
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'There was an error generating your headshot.',
        variant: 'destructive',
      });
    }
  });
  // Fetch recent headshots for this model/user
  useEffect(() => {
    let ignore = false;
    const fetchRecent = async () => {
      setIsRecentLoading(true);
      try {
        const res = await fetch(`/api/headshots?modelId=${modelIdInt}`);
        if (!res.ok) throw new Error('Failed to fetch headshots');
        const data = await res.json();
        if (!ignore) setRecentHeadshots(data);
      } catch (err) {
        if (!ignore) setRecentHeadshots([]);
      } finally {
        if (!ignore) setIsRecentLoading(false);
      }
    };
    if (modelIdInt) fetchRecent();
    return () => { ignore = true; };
  }, [modelIdInt, generateMutation.isPending]);
  const onSubmit = (values: GenerateFormValues) => {
    generateMutation.mutate(values);
  };

  if (isModelLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <StepIndicator currentStep="generate" modelId={modelIdInt} />
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <StepIndicator currentStep="generate" modelId={modelIdInt} />
      
      <Card className="mb-10">
        <CardContent className="pt-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Generate Your Headshots</h3>
            <p className="text-gray-600">
              Your model is ready! Choose a style and provide an optional prompt to generate your professional headshots.
            </p>
          </div>
          
          <div className="mb-8">
            <h4 className="font-medium mb-4">Choose a Style</h4>
            <HeadshotStyles 
              onSelectStyle={setSelectedStyle} 
              selectedStyle={selectedStyle}
            />
            <div className="mb-8">
              <h4 className="font-medium mb-4">Gender</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedGender === "male" ? "default" : "outline"}
                  className="w-24"
                  onClick={() => setSelectedGender("male")}
                >
                  Male
                </Button>
                <Button
                  variant={selectedGender === "female" ? "default" : "outline"}
                  className="w-24"
                  onClick={() => setSelectedGender("female")}
                >
                  Female
                </Button>
              </div>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optional Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add specific details like 'professional office background', 'smiling', 'serious expression', etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full md:w-auto"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Headshot'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Recent Generations Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Your Recent Generations</h3>
        
        <div className="bg-white rounded-xl shadow-sm p-8 text-center" id="recent-generations">
          {generateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h4 className="text-lg font-medium mb-2">Generating your headshot...</h4>
              <p className="text-gray-500">This may take a few moments.</p>
            </div>
          ) : isRecentLoading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h4 className="text-lg font-medium mb-2">Loading your headshots...</h4>
            </div>
          ) : recentHeadshots.length > 0 ? (
            <HeadshotGallery headshots={recentHeadshots} title="Your Recent Generations" showViewAll={false} />
          ) : (
            <>
              <svg 
                className="w-16 h-16 mx-auto mb-4 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-lg font-medium mb-2">No recent generations</h4>
              <p className="text-gray-500 mb-4">
                Your newly generated headshots will appear here.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generate;
