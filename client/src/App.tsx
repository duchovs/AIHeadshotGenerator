import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Upload from "@/pages/Upload";
import Train from "@/pages/Train";
import Generate from "@/pages/Generate";
import Gallery from "@/pages/Gallery";
import TokensPage from "@/pages/Tokens";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import LegalPage from "@/pages/Legal";

function Router() {

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/getstarted" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/upload" component={Upload} />
      <Route path="/train/:modelId?" component={Train} />
      <Route path="/generate/:modelId?" component={Generate} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/tokens" component={TokensPage} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      <Route path="/legal" component={LegalPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const noHeaderPaths = ["/login", "/"];
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          {!noHeaderPaths.includes(location) && <Header />}
          <main className="flex-grow bg-gray-50">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
