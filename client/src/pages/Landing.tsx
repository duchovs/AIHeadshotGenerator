import React, { useState, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useExampleHeadshots } from '@/hooks/use-headshots';
import { LoginButton, AuthState } from '@/components/LoginButton';
import { 
  CheckCircle, 
  X, 
  ChevronRight, 
  Upload, 
  Sparkles, 
  UserCheck, 
  Download, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  Zap, 
  Camera
} from 'lucide-react';

const Landing = () => {
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeSlide, setActiveSlide] = useState(0);
  const [transforming, setTransforming] = useState(false);
  const [statsCount, setStatsCount] = useState({ users: 0, headshots: 0 });
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const stylesRef = useRef(null);
  const pricingRef = useRef(null);
  const testimonialsRef = useRef(null);
  
  // Update activeSlide when carousel changes
  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setActiveSlide(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on('select', onSelect);
    
    // Proper cleanup function that returns void
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const HOST = import.meta.env.VITE_CLIENT_URL;
  //const exampleHeadshots = useExampleHeadshots();

  // Mock demo data
  const demoPersons = [
    { 
      id: 1, 
      name: "David", 
      original: HOST+'/original/david.jpg', 
      styles: {
        professional: HOST+'/examples/headshot_12.png',
        creative: HOST+'/examples/headshot_6.png',
        fantasy: HOST+'/examples/headshot_53.png',
        casual: HOST+'/examples/headshot_55.png'
      }
    },
    { 
      id: 2, 
      name: "Gia", 
      original: HOST+'/original/gia.jpeg', 
      styles: {
        professional: HOST+'/examples/headshot_30.png',
        creative: HOST+'/examples/headshot_21.png',
        fantasy: HOST+'/examples/headshot_19.png',
        casual: HOST+'/examples/headshot_31.png'
      }
    }
  ];

  const testimonials = [
    {
      name: "Sarah J.",
      role: "Marketing Executive",
      image: HOST+'/profile/sara.webp',
      text: "I needed professional headshots for a conference but didn't have time for a photo session. This service delivered stunning results in minutes!"
    },
    {
      name: "Michael T.",
      role: "Software Developer",
      image: HOST+'/profile/michael.webp',
      text: "The quality is incredible. I used my headshot for LinkedIn and immediately saw an increase in profile views and connection requests."
    },
    {
      name: "Priya K.",
      role: "Startup Founder",
      image: HOST+'/profile/priya.webp',
      text: "We got headshots for our entire team. The consistent, professional look has elevated our company's brand image significantly."
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: 10.00,
      features: [
        "4 AI-generated headshots",
        "3 style options",
        "HD downloads",
        "24-hour delivery"
      ],
      isPopular: false
    },
    {
      name: "Professional",
      price: 25.00,
      features: [
        "24 AI-generated headshots",
        "All style options",
        "Ultra HD downloads",
        "45-minute delivery",
        "LinkedIn optimization",
        "Minor retouching included"
      ],
      isPopular: true
    },
    {
      name: "Enterprise",
      price: 50.00,
      features: [
        "64 AI-generated headshots",
        "All style options",
        "Ultra HD downloads",
        "Priority generation (20 min)",
        "Team management dashboard",
        "Advanced retouching included",
        "Dedicated support"
      ],
      isPopular: false
    }
  ];

  const quizQuestions = [
    {
      question: "What is your primary purpose for your new headshot?",
      options: [
        "Corporate/Work Profile",
        "Showcasing Creativity",
        "Something Unique or Fantasy",
        "Social or Dating App",
      ]
    },
    {
      question: "Which environment best fits your personality?",
      options: [
        "Modern Office",
        "Art Studio",
        "Dreamy or Magical Setting",
        "Coffee Shop or Outdoors",
      ]
    },
    {
      question: "What do you want your headshot to communicate?",
      options: [
        "Professionalism and Reliability",
        "Artistic Flair",
        "Imagination and Escapism",
        "Approachability and Fun",
      ]
    },
    {
      question: "Pick a color palette you prefer:",
      options: [
        "Blues, Greys, and Neutrals",
        "Bold and Vibrant Colors",
        "Fantasy-inspired (purples, golds, ethereal)",
        "Warm and Natural Tones",
      ]
    },
    {
      question: "Which description fits you best?",
      options: [
        "Goal-oriented, career-focused",
        "Expressive, original, artistic",
        "Adventurous, imaginative, playful",
        "Friendly, relaxed, easygoing",
      ]
    },
  ];

  // Competitive comparison data
  const comparisonData = {
    features: [
      "AI-Generated Headshots",
      "Professional And Social Headshots",
      "Quick Turnaround",
      "Ultra HD Resolution",
      "On Demand Headshot Generation",
      "Optional Customizable Prompt"
    ],
    competitors: [
      {
        name: "Our Service",
        available: [true, true, true, true, true, true],
        pricing: "$10.00"
      },
      {
        name: "Leading Competitor",
        available: [true, false, false, true, false, false],
        pricing: "$50.00"
      }
    ]
  };

  // Simulating increasing stats count
  useEffect(() => {
    const interval = setInterval(() => {
      setStatsCount(prev => ({
        users: prev.users + Math.floor(Math.random() * 3),
        headshots: prev.headshots + Math.floor(Math.random() * 10)
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Initialize with some stat numbers
  useEffect(() => {
    setStatsCount({
      users: 12458,
      headshots: 89732
    });
  }, []);

  const handleStyleChange = (style) => {
    setTransforming(true);
    setSelectedStyle(style);
    
    // Simulate AI processing time
    setTimeout(() => {
      setTransforming(false);
    }, 800);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        
        // Simulate AI processing
        setTransforming(true);
        setTimeout(() => {
          setPreviewImage("/api/placeholder/400/500");
          setTransforming(false);
        }, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const startQuiz = () => {
    setShowQuiz(true);
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  const handleQuizAnswer = (answer) => {
    const newAnswers = [...quizAnswers, answer];
    setQuizAnswers(newAnswers);
    
    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Determine quiz result based on answers
      let recommendedStyle = 'professional';
      
      // Improved logic: score each style based on answers
      const styleScores = {
        professional: 0,
        creative: 0,
        fantasy: 0,
        casual: 0,
      };
      // Map each answer to a style
      const answerToStyle = [
        // Q1
        ['professional', 'creative', 'fantasy', 'casual'],
        // Q2
        ['professional', 'creative', 'fantasy', 'casual'],
        // Q3
        ['professional', 'creative', 'fantasy', 'casual'],
        // Q4
        ['professional', 'creative', 'fantasy', 'casual'],
        // Q5
        ['professional', 'creative', 'fantasy', 'casual'],
      ];
      newAnswers.forEach((answer, i) => {
        const idx = quizQuestions[i].options.indexOf(answer);
        if (idx !== -1) {
          const style = answerToStyle[i][idx];
          styleScores[style] += 1;
        }
      });
      // Pick the style with the highest score
      recommendedStyle = 'professional';
      let maxScore = 0;
      for (const style in styleScores) {
        if (styleScores[style] > maxScore) {
          recommendedStyle = style;
          maxScore = styleScores[style];
        }
      }
      
      setQuizResult(recommendedStyle);
    }
  };

  const scrollTo = (ref) => {
    ref.current.scrollIntoView({ behavior: 'smooth' });
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-100 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-gray-900/70 backdrop-blur-lg border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Camera className="text-purple-500" size={28} />
            <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">HeadshotAI</span>
          </div>
          
          <div className="hidden md:flex space-x-6">
            <button onClick={() => scrollTo(heroRef)} className="text-gray-300 hover:text-purple-400 transition">Home</button>
            <button onClick={() => scrollTo(featuresRef)} className="text-gray-300 hover:text-purple-400 transition">Features</button>
            <button onClick={() => scrollTo(stylesRef)} className="text-gray-300 hover:text-purple-400 transition">Styles</button>
            <button onClick={() => scrollTo(pricingRef)} className="text-gray-300 hover:text-purple-400 transition">Pricing</button>
            <button onClick={() => scrollTo(testimonialsRef)} className="text-gray-300 hover:text-purple-400 transition">Testimonials</button>
          </div>
          
          <div className="flex space-x-3">
            <LoginButton onAuthState={setAuthState} />
            <a href={authState && authState.isAuthenticated ? "/upload" : "/login"}>
            <button className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium transition">
              Get Started
            </button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-24 pb-20 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-purple-700/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-96 h-96 bg-red-700/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">Professional Headshots</span>
                <br />Created by AI in Seconds
              </h1>
              
              <p className="text-lg text-gray-300">
                Transform your ordinary photos into stunning professional headshots with our AI technology. Perfect for LinkedIn, company websites, and professional profiles.
              </p>
              
              <div className="flex items-center gap-4 py-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-purple-500/30"></div>
                  ))}
                </div>
                <div className="text-sm text-gray-400">
                  <span className="text-purple-400 font-semibold">{statsCount.users.toLocaleString()}</span> users have created <span className="text-purple-400 font-semibold">{statsCount.headshots.toLocaleString()}</span> headshots this month
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
              <a href={authState && authState.isAuthenticated ? "/upload" : "/login"}>
                <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium flex items-center gap-2 transition shadow-lg shadow-purple-900/20">
                  Generate Your Headshot <ArrowRight size={16} />
                </button>
                </a>
                <button onClick={startQuiz} className="px-6 py-3 rounded-lg bg-gray-800/50 border border-purple-500/20 hover:border-purple-500/50 text-gray-200 flex items-center gap-2 transition">
                  Find Your Style <Sparkles size={16} className="text-purple-400" />
                </button>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                {demoPersons.map((person) => (
                  <div key={person.id} className="group relative overflow-hidden rounded-xl shadow-xl shadow-purple-900/10 cursor-pointer bg-gray-800/30 backdrop-blur-sm border border-purple-500/10">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    
                    <div className="flex h-full">
                      <div className="w-1/2">
                        <img src={person.original} alt={`${person.name} original`} className="w-full h-full object-cover" />
                      </div>
                      <div className="w-1/2">
                        <img 
                          src={person.styles[selectedStyle]} 
                          alt={`${person.name} ${selectedStyle} style`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition duration-300">
                      <p className="text-sm font-medium text-white">Click to see transformations</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-6 space-x-3">
                {['professional', 'creative', 'fantasy', 'casual'].map((style) => (
                  <button
                    key={style}
                    onClick={() => handleStyleChange(style)}
                    className={`px-3 py-1 text-sm rounded-full capitalize transition ${
                      selectedStyle === style 
                        ? 'bg-gradient-to-r from-red-500 to-purple-600 text-white' 
                        : 'bg-gray-800/50 border border-purple-500/20 text-gray-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={featuresRef} className="py-20 bg-gray-900/50 backdrop-blur-sm relative">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Our advanced AI transforms your regular photos into professional headshots in just a few simple steps.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-purple-500/10 p-6 flex flex-col items-center text-center transition hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10">
              <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                <Upload className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-medium mb-2">Upload Photo</h3>
              <p className="text-gray-400 text-sm">Upload any clear photo of yourself facing the camera</p>
            </div>
            
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-purple-500/10 p-6 flex flex-col items-center text-center transition hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10">
              <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                <Sparkles className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-medium mb-2">AI Analysis</h3>
              <p className="text-gray-400 text-sm">Our AI analyzes your features and optimizes lighting</p>
            </div>
            
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-purple-500/10 p-6 flex flex-col items-center text-center transition hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10">
              <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                <UserCheck className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-medium mb-2">Select Style</h3>
              <p className="text-gray-400 text-sm">Choose from various professional styles that suit your needs</p>
            </div>
            
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-purple-500/10 p-6 flex flex-col items-center text-center transition hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10">
              <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                <Zap className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-medium mb-2">Generate</h3>
              <p className="text-gray-400 text-sm">Our AI creates multiple professional headshots in seconds</p>
            </div>
            
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-purple-500/10 p-6 flex flex-col items-center text-center transition hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10">
              <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                <Download className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-medium mb-2">Download</h3>
              <p className="text-gray-400 text-sm">Download your headshots in high resolution for any use</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Style Gallery */}
      <section ref={stylesRef} className="py-20 relative">
        <div className="absolute top-20 right-0 w-96 h-96 bg-red-700/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Interactive Style Gallery</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">See how our AI transforms photos into different professional styles. Click on any style to see it applied.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="col-span-2">
              <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20">
                <div className={`absolute inset-0 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm z-10 transition-opacity duration-500 ${transforming ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-purple-300">Transforming...</p>
                  </div>
                </div>
                
                <div className="slideshow-container h-128">
                  <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex h-full">
                      {demoPersons.map((person) => (
                        <div key={person.id} className="flex-[0_0_100%] min-w-0 h-full">
                          <div className="flex h-full">
                            <div className="w-1/2 h-full bg-gray-800 p-4 flex flex-col">
                              <p className="text-sm text-gray-400 mb-2">Original Photo</p>
                              <div className="flex-grow flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden">
                                <img src={person.original} alt={`${person.name} original`} className="max-h-full" />
                              </div>
                            </div>
                            <div className="w-1/2 h-full bg-gray-800 p-4 flex flex-col">
                              <p className="text-sm text-gray-400 mb-2">
                                <span className="capitalize">{selectedStyle}</span> Style
                              </p>
                              <div className="flex-grow flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden">
                                <img src={person.styles[selectedStyle]} alt={`${person.name} ${selectedStyle} style`} className="max-h-full" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-center gap-2 mt-4">
                    {demoPersons.map((_, index) => (
                      <button
                        key={index}
                        className={`w-3 h-3 rounded-full ${activeSlide === index ? 'bg-purple-500' : 'bg-gray-400'}`}
                        onClick={() => emblaApi?.scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Choose Your Style</h3>
                  <p className="text-gray-400">Our AI can generate headshots in multiple professional styles tailored to your needs.</p>
                </div>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => handleStyleChange('professional')}
                    className={`w-full p-4 rounded-lg flex items-center justify-between transition ${
                      selectedStyle === 'professional' 
                        ? 'bg-gradient-to-r from-red-500/20 to-purple-600/20 border border-purple-500/50' 
                        : 'bg-gray-800/50 border border-purple-500/10'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        selectedStyle === 'professional' ? 'bg-purple-500' : 'bg-gray-700'
                      }`}>
                        <UserCheck size={20} className={selectedStyle === 'professional' ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <div>
                        <h4 className="font-medium">Professional</h4>
                        <p className="text-xs text-gray-400">Perfect for LinkedIn and corporate profiles</p>
                      </div>
                    </div>
                    {selectedStyle === 'professional' && <CheckCircle size={20} className="text-purple-500" />}
                  </button>
                  
                  <button 
                    onClick={() => handleStyleChange('creative')}
                    className={`w-full p-4 rounded-lg flex items-center justify-between transition ${
                      selectedStyle === 'creative' 
                        ? 'bg-gradient-to-r from-red-500/20 to-purple-600/20 border border-purple-500/50' 
                        : 'bg-gray-800/50 border border-purple-500/10'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        selectedStyle === 'creative' ? 'bg-purple-500' : 'bg-gray-700'
                      }`}>
                        <Sparkles size={20} className={selectedStyle === 'creative' ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <div>
                        <h4 className="font-medium">Creative</h4>
                        <p className="text-xs text-gray-400">For designers, artists and creative roles</p>
                      </div>
                    </div>
                    {selectedStyle === 'creative' && <CheckCircle size={20} className="text-purple-500" />}
                  </button>
                  
                  <button 
                    onClick={() => handleStyleChange('fantasy')}
                    className={`w-full p-4 rounded-lg flex items-center justify-between transition ${
                      selectedStyle === 'fantasy' 
                        ? 'bg-gradient-to-r from-red-500/20 to-purple-600/20 border border-purple-500/50' 
                        : 'bg-gray-800/50 border border-purple-500/10'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        selectedStyle === 'fantasy' ? 'bg-purple-500' : 'bg-gray-700'
                      }`}>
                        <DollarSign size={20} className={selectedStyle === 'fantasy' ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <div>
                        <h4 className="font-medium">Fantasy</h4>
                        <p className="text-xs text-gray-400">creative roles, imaginative portfolios, or anyone seeking a magical, otherworldly look</p>
                      </div>
                    </div>
                    {selectedStyle === 'fantasy' && <CheckCircle size={20} className="text-purple-500" />}
                  </button>
                  
                  <button 
                    onClick={() => handleStyleChange('casual')}
                    className={`w-full p-4 rounded-lg flex items-center justify-between transition ${
                      selectedStyle === 'casual' 
                        ? 'bg-gradient-to-r from-red-500/20 to-purple-600/20 border border-purple-500/50' 
                        : 'bg-gray-800/50 border border-purple-500/10'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        selectedStyle === 'casual' ? 'bg-purple-500' : 'bg-gray-700'
                      }`}>
                        <Clock size={20} className={selectedStyle === 'casual' ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <div>
                        <h4 className="font-medium">Casual</h4>
                        <p className="text-xs text-gray-400">Approachable, friendly style for social profiles</p>
                      </div>
                    </div>
                    {selectedStyle === 'casual' && <CheckCircle size={20} className="text-purple-500" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Try It Free Section */}
      {/*
      <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-purple-900/10 backdrop-filter backdrop-blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto bg-gray-800/40 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-8 shadow-2xl shadow-purple-900/20">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Try It Free Right Now</h2>
                <p className="text-gray-300 mb-6">Upload your photo and see the transformation with one style for free, no signup required.</p>
                
                <div className="space-y-4">
                  <label className="w-full h-32 border-2 border-dashed border-purple-500/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/60 transition">
                    <Upload className="text-purple-400 mb-2" size={24} />
                    <span className="text-sm text-gray-300">Upload your photo</span>
                    <span className="text-xs text-gray-500">JPG, PNG • Max 5MB</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                    />
                  </label>
                  
                  {uploadedImage && !previewImage && (
                    <div className="relative bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-16 h-16 rounded-lg overflow-hidden mr-4">
                          <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 to-purple-600 w-3/4 animate-pulse"></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Processing your image...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="md:w-1/2">
                {previewImage ? (
                  <div className="flex flex-col items-center">
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden mb-4">
                      <img src={previewImage} alt="AI Generated Headshot Preview" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-center py-2 px-1">
                        <span className="text-xs text-white">Free preview</span>
                      </div>
                    </div>
                    <div className="space-y-3 w-full">
                      <button className="w-full py-2 rounded-lg bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium flex items-center justify-center gap-2 transition">
                        Get All Styles <ArrowRight size={16} />
                      </button>
                      <button className="w-full py-2 rounded-lg bg-gray-800 border border-purple-500/20 text-gray-300 text-sm">
                        Try Another Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-purple-500/10 p-6 h-full flex flex-col items-center justify-center text-center">
                    <Sparkles className="text-purple-400 mb-4" size={32} />
                    <h3 className="text-xl font-medium mb-2">See the Magic</h3>
                    <p className="text-gray-400 text-sm">Upload your photo to experience how our AI transforms it into a professional headshot.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* Pricing Section with Comparison */}
      <section ref={pricingRef} className="py-20 relative">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Choose the plan that works best for your needs. All plans include our AI-powered headshot generation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative rounded-xl overflow-hidden transition-transform hover:-translate-y-2 ${
                  plan.isPopular 
                    ? 'bg-gradient-to-b from-purple-900/40 to-gray-800/60 border-2 border-purple-500/30 shadow-xl shadow-purple-900/20' 
                    : 'bg-gray-800/30 backdrop-blur-sm border border-purple-500/10'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-red-500 to-purple-600 text-white text-xs font-bold py-1 px-4 rounded-bl-lg">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-400 text-sm ml-1">one-time</span>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start">
                        <CheckCircle size={20} className="text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <a href={authState && authState.isAuthenticated ? "/tokens" : "/login"}>
                  <button className={`w-full py-3 rounded-lg font-medium transition ${
                    plan.isPopular 
                      ? 'bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  }`}>
                    Select {plan.name}
                  </button>
                  </a>
                </div>
              </div>
            ))}
          </div>
          
          {/* Competitor Comparison */}
          <div className="max-w-4xl mx-auto bg-gray-800/30 backdrop-blur-sm rounded-xl border border-purple-500/10 overflow-hidden">
            <div className="p-6 border-b border-purple-500/10">
              <h3 className="text-xl font-bold">How We Compare</h3>
              <p className="text-gray-400 text-sm">See how our service stacks up against competitors</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="py-4 px-6 text-left text-gray-300 font-medium">Features</th>
                    {comparisonData.competitors.map((competitor, i) => (
                      <th key={i} className="py-4 px-6 text-left text-gray-300 font-medium">
                        {competitor.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.features.map((feature, i) => (
                    <tr key={i} className="border-t border-gray-700/30">
                      <td className="py-3 px-6 text-gray-300">{feature}</td>
                      {comparisonData.competitors.map((competitor, j) => (
                        <td key={j} className="py-3 px-6">
                          {competitor.available[i] ? (
                            <CheckCircle size={20} className={j === 0 ? "text-purple-400" : "text-gray-500"} />
                          ) : (
                            <X size={20} className="text-gray-600" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-gray-700/30 bg-gray-800/30">
                    <td className="py-4 px-6 font-medium text-gray-300">Starting Price</td>
                    {comparisonData.competitors.map((competitor, i) => (
                      <td key={i} className={`py-4 px-6 font-medium ${i === 0 ? "text-purple-400" : "text-gray-300"}`}>
                        {competitor.pricing}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-20 bg-gray-900/50 backdrop-blur-sm relative">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Don't just take our word for it. See the results and hear from our satisfied customers.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-purple-500/10 p-6 transition hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <button className="px-6 py-3 rounded-lg bg-gray-800/50 border border-purple-500/20 hover:border-purple-500/50 text-gray-200 flex items-center gap-2 mx-auto transition">
              Read More Reviews <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-red-900/20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">Ready to Transform Your Professional Image?</h2>
            <p className="text-xl text-gray-300">Join thousands of professionals who have elevated their online presence with our AI-generated headshots.</p>
            
            <div className="flex flex-wrap justify-center gap-4">
            <a href={authState && authState.isAuthenticated ? "/upload" : "/login"}>
              <button className="px-8 py-4 rounded-lg bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium flex items-center gap-2 transition shadow-lg shadow-purple-900/20">
                Generate Your Headshot Now <ArrowRight size={20} />
              </button>
            </a>
              <button onClick={startQuiz} className="px-8 py-4 rounded-lg bg-gray-800/50 border border-purple-500/20 hover:border-purple-500/50 text-gray-200 flex items-center gap-2 transition">
                Find Your Perfect Style <Sparkles size={20} className="text-purple-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Style Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-purple-500/20 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-5 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center">
                  <Sparkles className="text-purple-400 mr-2" size={20} />
                  Style Quiz
                </h3>
                <button onClick={closeQuiz} className="text-gray-400 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {quizResult ? (
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-purple-900/30 flex items-center justify-center">
                    <UserCheck className="text-purple-400" size={32} />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold">Your Perfect Style: <span className="capitalize text-purple-400">{quizResult}</span></h4>
                    <p className="text-gray-300">Based on your answers, we recommend the {quizResult} style for your professional headshots.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <button className="w-full py-3 rounded-lg bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium transition">
                      Try This Style Now
                    </button>
                    <button onClick={closeQuiz} className="w-full py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition">
                      Close Quiz
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Question {quizStep + 1} of {quizQuestions.length}</span>
                      <span>Progress: {Math.round(((quizStep) / quizQuestions.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-purple-600" 
                        style={{ width: `${((quizStep) / quizQuestions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-medium mb-4">{quizQuestions[quizStep].question}</h4>
                  
                  <div className="space-y-3">
                    {quizQuestions[quizStep].options.map((option, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleQuizAnswer(option)}
                        className="w-full py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-left text-gray-200 transition flex justify-between items-center"
                      >
                        {option}
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;