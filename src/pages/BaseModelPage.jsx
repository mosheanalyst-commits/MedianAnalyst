import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BaseModelCalculator from '../components/BaseModelCalculator';
import CalculatorDisclaimer from '../components/CalculatorDisclaimer';

export default function BaseModelPage() {
  return (
    <div className="py-stack-lg px-margin-mobile md:px-margin-desktop max-w-[1000px] mx-auto">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "The Base Model",
            "url": "https://mediananalyst.com/calculators/base-model",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "description": "Evaluates index return-to-risk equilibrium based on cash supply, personal savings, GDP, public debt and inflation levels.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "isPartOf": { "@type": "WebSite", "name": "MedianAnalyst", "url": "https://mediananalyst.com" }
          })}
        </script>
      </Helmet>

      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-label-sm text-on-surface-variant">
        <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link to="/calculators" className="hover:text-secondary transition-colors">Calculators</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary font-bold">The Base Model Calculator</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="font-headline-md text-primary mb-2 flex items-center gap-2">
          <span className="w-8 h-1 bg-secondary rounded-full"></span>
          The Base Model Calculator
        </h1>
        <p className="font-body-md text-on-surface-variant max-w-2xl">
          Evaluate index return-to-risk equilibrium and project Dow Jones Industrial Average target rates based on cash supply, personal savings, GDP, public debt and inflation levels.
        </p>
      </header>

      {/* Calculator Component */}
      <BaseModelCalculator />

      {/* Disclaimer */}
      <CalculatorDisclaimer />
    </div>
  );
}
