import React, { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

const LegalPage = () => {
  const [location] = useLocation();
  const mainRef = useRef(null);
  const privacyPolicyRef = useRef(null);
  const termsOfServiceRef = useRef(null);

  useEffect(() => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, []);
  
  return (
    <div ref={mainRef} className="min-h-screen bg-slate-900 text-slate-300 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="bg-slate-800 shadow-xl rounded-lg p-6 md:p-10 border border-slate-700">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Legal Information</h1>

          <section id="privacy-policy" ref={privacyPolicyRef} className="mb-12 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-indigo-400 mb-6 border-b border-slate-700 pb-3">Privacy Policy</h2>
            <p className="mb-4 text-lg leading-relaxed">
              Your privacy is important to us. It is AI Headshot Generator's policy to respect your privacy regarding any information we may collect from you across our website.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Information We Collect</h3>
            <p className="mb-4 leading-relaxed">
              We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
            </p>
            <p className="mb-4 leading-relaxed">
              The primary data we handle are the photos you upload for headshot generation. We also collect information necessary for account management and payment processing if applicable.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Use of Your Photos and Personal Data</h3>
            <p className="mb-4 font-semibold text-indigo-300 leading-relaxed">
              We will not use your photos to train any AI models. Your original photos are used solely for the purpose of generating your requested headshots and are not used for any other purpose. We will not give ANY personal data, including your photos or other identifying information, to third parties, except as required by law or for essential service provision (e.g., payment processors), and only with transparent disclosure.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Data Retention</h3>
            <p className="mb-4 leading-relaxed">
              We only retain collected information for as long as necessary to provide you with your requested service. Generated headshots may be stored for a limited period to allow you to download them, after which they are securely deleted. Original uploaded photos are deleted shortly after the generation process is complete.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Security</h3>
            <p className="mb-4 leading-relaxed">
              What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.
            </p>
          </section>

          <section id="terms-of-service" ref={termsOfServiceRef} className="mb-12 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-indigo-400 mb-6 border-b border-slate-700 pb-3">Terms of Service</h2>
            <p className="mb-4 text-lg leading-relaxed">
              By accessing the website at AI Headshot Generator, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Use License</h3>
            <ol className="list-decimal list-inside mb-4 space-y-2 pl-4 leading-relaxed">
              <li>
                <strong>Ownership and Usage Rights:</strong> You retain full ownership and all rights to the headshot images generated through our service. This includes, but is not limited to, the right to:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Download and save your generated headshots</li>
                  <li>Use your headshots for personal or commercial purposes</li>
                  <li>Modify, edit, or alter your generated headshots</li>
                  <li>Share and distribute your headshots on social media, websites, or other platforms</li>
                  <li>Use your headshots for professional profiles, marketing materials, or any other legal purpose</li>
                </ul>
              </li>
              <li>
                <strong>Service Usage:</strong> While you own the generated images, you agree not to:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Use the service to generate illegal, harmful, or offensive content</li>
                  <li>Attempt to reverse engineer or copy the underlying technology</li>
                  <li>Use the service in a way that violates these terms or applicable laws</li>
                </ul>
              </li>
            </ol>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Disclaimer</h3>
            <p className="mb-4 leading-relaxed">
              The materials on AI Headshot Generator's website are provided on an 'as is' basis. AI Headshot Generator makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            <p className="mb-4 font-semibold text-indigo-300 leading-relaxed">
              Further, AI Headshot Generator does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site. We explicitly state that we will not use your photos to train any models or give ANY personal data to third parties, as detailed in our Privacy Policy.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Limitations</h3>
            <p className="mb-4 leading-relaxed">
              In no event shall AI Headshot Generator or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on AI Headshot Generator's website, even if AI Headshot Generator or a AI Headshot Generator authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Governing Law</h3>
            <p className="mb-4 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of California, USA and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </p>
             <h3 className="text-xl font-semibold text-white mt-6 mb-3">Contact Us</h3>
            <p className="mb-4 leading-relaxed">
              If you have any questions about these Terms, please contact us at support@aismartsolution.ai.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LegalPage;
