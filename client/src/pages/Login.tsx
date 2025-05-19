import { useState } from 'react';
import LoginButton from "@/components/LoginButton";
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useExampleHeadshots } from '@/hooks/use-headshots';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

// Define form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: exampleHeadshots, isLoading: isLoadingExampleHeadshots, error: exampleHeadshotsError } = useExampleHeadshots();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success notification
      toast({
        title: "Login successful",
        description: "Welcome back to AI Headshot Generator!",
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      // Error notification
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reviews data
  const reviews = [
    {
      text: "Impressed! Definitely exceeded my expectations! The resemblance is uncanny and I love it. My parents couldn't distinguish between the AI generated shots vs my actual photos!",
      author: "Sarah J."
    },
    {
      text: "Perfect for profile photos for my resume, LinkedIn and all other professional situations!",
      author: "Michael T."
    },
    {
      text: "I was skeptical at first, but the results are amazing. Worth every penny!",
      author: "Alex R."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background collage */}
      <div className="fixed inset-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 grid-rows-4 gap-1 opacity-90">
        {exampleHeadshots?.map((headshot, i) => (
          <div 
            key={headshot.id || i} 
            className="bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${headshot.imageUrl})`,
              filter: 'brightness(0.8)'
            }}
          />
        ))}
      </div>
      
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" />
      
      {/* Content */}
      <div className="relative flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl bg-white/95 backdrop-blur shadow-xl">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2">
              {/* Left side - Info and reviews */}
              <div className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-l-lg">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2">Turn your Selfies into Professional Headshots</h1>
                  <p className="text-gray-600 mb-6">
                    Get studio-quality professional headshots in minutes using our AI technology.
                    Perfect for LinkedIn, resumes, and professional profiles.
                  </p>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          className="w-5 h-5 text-yellow-400" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium text-blue-600">Super amazing headshots!</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border-l-4 border-primary/50 pl-4 italic">
                      <p className="text-gray-700 mb-2">{reviews[0].text}</p>
                      <p className="text-sm text-gray-500">— {reviews[0].author}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>No photoshoot needed</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Highly realistic</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>100% money back guarantee</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Trusted by companies worldwide</p>
                      <div className="flex flex-wrap justify-center gap-4 items-center">
                        <span className="text-gray-400 font-medium">Google</span>
                        <span className="text-gray-400 font-medium">Tesla</span>
                        <span className="text-gray-400 font-medium">Apple</span>
                        <span className="text-gray-400 font-medium">Uber</span>
                        <span className="text-gray-400 font-medium">Amazon</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Login form */}
              <div className="p-8">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold">Login to your dashboard</h2>
                  <p className="text-gray-600">or create an account for headshots</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <LoginButton />
                  </div>
                  {/*}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Login</TabsTrigger>
                      <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                Remember me
                              </label>
                            </div>
                            
                            <div className="text-sm">
                              <a href="#" className="font-medium text-primary hover:text-primary/80">
                                Forgot password?
                              </a>
                            </div>
                          </div>
                          
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Please wait
                              </>
                            ) : (
                              "Sign in"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>
                    
                    <TabsContent value="register">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first-name">First name</Label>
                            <Input id="first-name" placeholder="John" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last-name">Last name</Label>
                            <Input id="last-name" placeholder="Doe" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="you@example.com" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" placeholder="••••••••" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <Input id="confirm-password" type="password" placeholder="••••••••" />
                        </div>
                        
                        <Button className="w-full">Create account</Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                  */}
                  <p className="text-center text-sm text-gray-600 mt-4">
                    By signing in, you agree to our{" "}
                    <a href="#" className="font-medium text-primary hover:text-primary/80">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="font-medium text-primary hover:text-primary/80">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats at bottom */}
        <div className="absolute bottom-4 text-center text-white">
          <div className="font-bold text-2xl">15 million headshots</div>
          <div className="text-sm">created for happy customers</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
