import { Card, CardContent } from "@/components/ui/card";

interface StyleCardProps {
  style: string;
  onClick?: () => void;
  isSelected?: boolean;
}

import { STYLE_PROMPTS, getStylePrompt } from '@shared/prompts';
export { STYLE_PROMPTS, getStylePrompt };

const StyleCard = ({ style, onClick, isSelected }: StyleCardProps) => {
  const styles: Record<string, string> = {
    'corporate': 'bg-blue-50 text-blue-600',
    'casual': 'bg-green-50 text-green-600',
    'artistic': 'bg-pink-50 text-pink-600', 
    'outdoor': 'bg-amber-50 text-amber-600',
    'fantasy': 'bg-sky-50 text-sky-600'
  };
  
  const bgColor = styles[style.toLowerCase()] || 'bg-gray-50 text-gray-600';
  
  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <div className={`w-24 h-24 rounded-full mx-auto mb-3 ${bgColor} flex items-center justify-center`}>
          <svg 
            className="w-12 h-12" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <h4 className="font-medium">{style}</h4>
      </CardContent>
    </Card>
  );
};

interface HeadshotStylesProps {
  onSelectStyle?: (style: string) => void;
  selectedStyle?: string;
}

const HeadshotStyles = ({ onSelectStyle, selectedStyle }: HeadshotStylesProps) => {
  const styles = [
    'Corporate',
    'Casual',
    'Artistic',
    'Outdoor',
    'Fantasy'
  ];

  return (
    <div className="mb-10">
      <h3 className="text-xl font-semibold mb-6">Available Headshot Styles</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {styles.map((style) => (
          <StyleCard 
            key={style} 
            style={style} 
            onClick={() => onSelectStyle && onSelectStyle(style)}
            isSelected={selectedStyle === style}
          />
        ))}
      </div>
    </div>
  );
};

export default HeadshotStyles;
