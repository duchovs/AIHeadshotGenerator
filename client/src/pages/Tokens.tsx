import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

const tokenPackages = [
  {
    id: "SMALL",
    tokens: 10,
    price: "$10",
    priceId: "price_1RKbw9PMGJt1NObrSRpXjmtI",
    description: "Perfect for trying out the service",
  },
  {
    id: "MEDIUM",
    tokens: 30,
    price: "$25",
    priceId: "price_1RKbwwPMGJt1NObrnxa19Pea",
    description: "Most popular choice for professionals",
    highlight: true,
  },
  {
    id: "LARGE",
    tokens: 70,
    price: "$50",
    priceId: "price_1RKbxSPMGJt1NObr2JIZs3eO",
    description: "Best value for active users",
  },
];

const TokensPage = () => {
  const [, setLocation] = useLocation();

  const createCheckoutSession = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create checkout session");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error) => {
      if (error.message === "Not authenticated") {
        setLocation("/login");
      }
      console.error("Checkout error:", error);
    },
  });

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Purchase Tokens</h1>
          <p className="text-gray-600 text-lg">
            Choose a token package to generate more AI headshots
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tokenPackages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={pkg.highlight ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{pkg.tokens} Tokens</span>
                  <Coins className="text-yellow-500" />
                </CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">{pkg.price}</div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={pkg.highlight ? "default" : "outline"}
                  onClick={() => createCheckoutSession.mutate(pkg.priceId)}
                  disabled={createCheckoutSession.isPending}
                >
                  {createCheckoutSession.isPending ? "Processing..." : "Purchase"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokensPage;
