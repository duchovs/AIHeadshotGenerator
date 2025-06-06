import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import HeadshotGallery, { HeadshotItem } from '@/components/HeadshotGallery';
import ExamplesGallery from '@/components/ExamplesGallery';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useHeadshots, type ExampleHeadshotItem } from '@/hooks/use-headshots';
import { EXAMPLE_HEADSHOTS } from '@/components/ExamplesModal';

const Gallery = () => {
  const [headshots, setHeadshots] = useState<HeadshotItem[]>([]);
  const [favorites, setFavorites] = useState<HeadshotItem[]>([]);
  const [examples, setExamples] = useState<HeadshotItem[]>(
    EXAMPLE_HEADSHOTS.map((ex: ExampleHeadshotItem) => ({
      ...ex,
      favorite: false, // Add default favorite
      modelId: ex.headshotId, // Use headshotId as modelId
    }))
  );
  
  const { data, isLoading, error } = useHeadshots();
  
  useEffect(() => {
    if (data) {
      setHeadshots(data);
      setFavorites(data.filter((headshot: any) => headshot.favorite));
    }
  }, [data]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {error ? (
        <ExamplesGallery 
          headshots={examples}
          title="Example Headshots" 
          isLoading={isLoading}
        />
      ) : (
        <>
        <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Headshot Gallery</h1>
        <p className="text-gray-600 mt-2">
          View and manage all your generated headshots
        </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="all">
              <TabsList className="mb-8">
                <TabsTrigger value="all">All Headshots</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </TabsList>
            
            <TabsContent value="all">
              <HeadshotGallery 
                headshots={headshots} 
                title="All Headshots" 
                showViewAll={false}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="favorites">
              <HeadshotGallery 
                headshots={favorites} 
                title="Favorite Headshots" 
                showViewAll={false}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
};

export default Gallery;
