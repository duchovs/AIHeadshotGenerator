import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, 
  Cog, 
  Image,
} from "lucide-react";

const FeatureSection = () => {
  const features = [
    {
      icon: Upload,
      title: "1. Upload Photos",
      description: "Upload 10-20 high-quality photos of yourself from different angles"
    },
    {
      icon: Cog,
      title: "2. Train Your Model",
      description: "Our AI learns your facial features and expressions"
    },
    {
      icon: Image,
      title: "3. Generate Headshots",
      description: "Choose from various professional styles and download your new headshots"
    }
  ];

  return (
    <Card className="mb-10">
      <CardContent className="pt-6">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold mb-2">How It Works</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">Create stunning professional headshots in three simple steps</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="bg-primary-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureSection;
