import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useCreateCheckoutSession } from "@/hooks/use-stripe";
import { useState } from "react";

type TokenPackage = {
  id: 'SMALL' | 'MEDIUM' | 'LARGE';
  tokens: number;
  price: string;
  priceId: string;
  highlight?: boolean;
};

const useTokenPackages = () => {
  return useQuery<TokenPackage[]>({
    queryKey: ['tokenPackages'],
    queryFn: async () => {
      const response = await fetch('/api/stripe/packages');
      if (!response.ok) {
        throw new Error('Failed to fetch token packages');
      }
      return response.json();
    },
  });
};

const descriptions = {
  SMALL: 'Perfect for trying out the service',
  MEDIUM: 'Most popular choice for professionals',
  LARGE: 'Best value for active users',
};

const TokensPage = () => {
  const [, setLocation] = useLocation();
  const { data: tokenPackages = [], isLoading, error } = useTokenPackages();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { mutate: createCheckoutSession } = useCreateCheckoutSession();
  
  const handleCheckout = (priceId: string) => {
    setLoadingPlan(priceId);
    createCheckoutSession(priceId, {
      onSuccess: (data) => {
        setLoadingPlan(null);
        // Redirect to Stripe Checkout URL on success
        window.location.href = data.url;
      },
      onError: (error) => {
        setLoadingPlan(null);
        if (error.message === "Not authenticated") {
          setLocation("/login");
        }
        console.error("Checkout error:", error);
      }
    });
  };

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Purchase Tokens</h1>
          <p className="text-gray-600 text-lg">
            Choose a token package to generate more AI headshots
          </p>
        </div>

        {isLoading ? (
          <div className="text-center p-4">Loading packages...</div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">Error loading packages</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto p-4">
            {tokenPackages.map((pkg: TokenPackage) => (
              <Card 
                key={pkg.id} 
                className={pkg.highlight ? "border-primary shadow-lg" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pkg.tokens} Tokens</span>
                    <Coins className="text-yellow-500" />
                  </CardTitle>
                  <CardDescription>{descriptions[pkg.id as keyof typeof descriptions]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-center">{pkg.price}</div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleCheckout(pkg.priceId)}
                    disabled={!!loadingPlan}
                    className="w-full" 
                    variant={pkg.highlight ? "default" : "outline"}
                  >
                    {loadingPlan === pkg.priceId ? 'Processing...' : 'Purchase'}
                    {loadingPlan === pkg.priceId && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokensPage;
