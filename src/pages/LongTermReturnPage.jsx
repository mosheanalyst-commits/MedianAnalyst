import { Link } from 'react-router-dom';
import LongTermReturnCalculator from '../components/LongTermReturnCalculator';
import CalculatorDisclaimer from '../components/CalculatorDisclaimer';

export default function LongTermReturnPage() {
  return (
    <div className="py-stack-lg px-margin-mobile md:px-margin-desktop max-w-[1000px] mx-auto">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-label-sm text-on-surface-variant">
        <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link to="/calculators" className="hover:text-secondary transition-colors">Calculators</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary font-bold">Long-Term Return Calculator</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="font-headline-md text-primary mb-2 flex items-center gap-2">
          <span className="w-8 h-1 bg-secondary rounded-full"></span>
          Long-Term Return Calculator
        </h1>
        <p className="font-body-md text-on-surface-variant max-w-2xl">
          Assess compound index return projections, compensation for risk parameters, and evaluate Dow Jones Industrial Average target rates across varying inflation limits.
        </p>
      </header>

      {/* Calculator Component */}
      <LongTermReturnCalculator />

      {/* Disclaimer */}
      <CalculatorDisclaimer />
    </div>
  );
}
