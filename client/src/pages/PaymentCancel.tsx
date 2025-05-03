import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const PaymentCancel = () => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // After 2 seconds, redirect back to tokens page
    const timer = setTimeout(() => {
      setLocation("/tokens");
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-8">
          Your payment was cancelled. No tokens have been added to your account.
        </p>
        <Button onClick={() => setLocation("/tokens")}>
          Return to Token Store
        </Button>
      </div>
    </div>
  );
};

export default PaymentCancel;
