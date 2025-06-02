// use-stripe.ts
import { useMutation, UseMutationResult } from "@tanstack/react-query";

interface CheckoutSessionResponse {
  url: string;
  // Add other response fields as needed
}

export const useCreateCheckoutSession = (): UseMutationResult<CheckoutSessionResponse, Error, string> => {
  return useMutation<CheckoutSessionResponse, Error, string>({
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
    }
  });
};