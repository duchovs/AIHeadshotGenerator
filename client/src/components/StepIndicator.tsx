import { Link } from "wouter";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepIndicatorProps {
  currentStep: 'upload' | 'train' | 'generate';
  modelId?: number;
}

const StepIndicator = ({ currentStep, modelId }: StepIndicatorProps) => {
  const steps = [
    { key: 'upload', label: 'Upload Photos', number: 1 },
    { key: 'train', label: 'Train Model', number: 2 },
    { key: 'generate', label: 'Generate Headshots', number: 3 }
  ];

  return (
    <div className="mb-10">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Create Your AI Headshots</h2>
        <div className="bg-gray-100 rounded-full p-1 flex">
          {steps.map((step) => (
            <Button
              key={step.key}
              variant={currentStep === step.key ? "default" : "ghost"}
              className={`rounded-full ${currentStep === step.key ? "" : "text-gray-600"}`}
              asChild={step.key !== currentStep}
              disabled={
                (step.key === 'train' && currentStep === 'upload') || 
                (step.key === 'generate' && (currentStep === 'upload' || currentStep === 'train'))
              }
            >
              {step.key !== currentStep ? (
                <Link href={
                  step.key === 'upload' 
                    ? '/upload' 
                    : step.key === 'train' 
                      ? (modelId ? `/train/${modelId}` : '/train') 
                      : (modelId ? `/generate/${modelId}` : '/generate')
                }>
                  {step.label}
                </Link>
              ) : (
                <span>{step.label}</span>
              )}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const stepPosition = steps.findIndex(s => s.key === currentStep);
            const isCompleted = index < stepPosition;
            const isCurrent = step.key === currentStep;
            
            return (
              <div key={step.key} className="flex items-center">
                <span 
                  className={`h-7 w-7 rounded-full flex items-center justify-center ring-4 ring-white ${
                    isCompleted ? 'bg-primary' : isCurrent ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <span className={`text-xs font-medium ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                      {step.number}
                    </span>
                  )}
                </span>
                <span className={`ml-2 text-sm font-medium ${
                  isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
