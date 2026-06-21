import { useMemo, useState } from 'react';
import useCalculatorConsts from '../hooks/useCalculatorConsts';

const MACHETE_CONST_DEFAULTS = {
  toCalculateDebtRatio: 2.5,
  defaultPublicDebt: 122.49,
  defaultFinancialInflation: 2.9,
  defaultAssetPrice: 120,
};

// ─── Pure Calculation Engine ─────────────────────────────────────────────────
function computeMachete(
  { publicDebt, financialInflation, assetPrice },
  { toCalculateDebtRatio }
) {
  const pDebt = Math.max(0, publicDebt || 0);
  const finInf = Math.max(0, financialInflation || 0);
  const price = Math.max(0.0001, assetPrice || 0.0001);

  // Step 1: Debt Ratio = (Public Debt * toCalculateDebtRatio) / 100
  const debtRatio = (pDebt * toCalculateDebtRatio) / 100;

  // Step 2: Risk-indifferent Interest Rate = Debt Ratio * Financial Inflation
  const riskIndifferentRate = debtRatio * finInf;

  // Step 3: Risk Interest Rate = (Risk-indifferent Rate) ^ 2
  const riskInterestRate = Math.pow(riskIndifferentRate, 2);

  // Step 4: Log Skew = (Risk-indifferent Rate) ^ 3
  const logSkew = Math.pow(riskIndifferentRate, 3);

  // Step 5: Range of Risk = Log Skew - Risk Interest Rate
  const rangeOfRisk = logSkew - riskInterestRate;

  // Step 6: Machete Potential Risk = Sqrt(Range of Risk)
  const macheteRisk = rangeOfRisk > 0 ? Math.sqrt(rangeOfRisk) : 0;

  // Step 7: Asset boundaries
  const upperRange = price + macheteRisk;
  const lowerRange = price - macheteRisk;

  // Coefficients
  const upwardCoeff = 1 + (macheteRisk / price);
  const downwardCoeff = macheteRisk / price;

  return {
    debtRatio,
    riskIndifferentRate,
    riskInterestRate,
    logSkew,
    rangeOfRisk,
    macheteRisk,
    upperRange,
    lowerRange,
    upwardCoeff,
    downwardCoeff,
  };
}

// ─── Formatting Helper ───────────────────────────────────────────────────────
const fmt = (v, decimals = 4) => {
  if (v === null || v === undefined || isNaN(v) || !isFinite(v)) return '—';
  return v.toFixed(decimals);
};

// ─── Reusable UI Sub-components ──────────────────────────────────────────────
function StepHeader({ label, icon, color = 'bg-secondary' }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${color} text-on-secondary rounded-t-lg`}>
      <span className="material-symbols-outlined text-xl">{icon}</span>
      <h3 className="font-title-lg">{label}</h3>
    </div>
  );
}

function ParamRow({ label, sublabel, value, onChange, disabled = false, suffix = '' }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3 items-center py-3 px-4 border-b border-outline-variant/30 last:border-b-0">
      <div>
        <div className="font-bold text-primary text-sm">{label}</div>
        {sublabel && (
          <div className="text-xs text-on-surface-variant mt-0.5">{sublabel}</div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className={`w-full border border-outline-variant rounded-lg p-2.5 text-center font-bold font-data-tabular text-primary transition-all focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 ${
            disabled ? 'bg-surface-container-high cursor-not-allowed opacity-60' : 'bg-white hover:border-primary/40'
          }`}
        />
        {suffix && <span className="text-on-surface-variant font-label-sm shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

function ResultRow({ label, value, highlight = false, large = false }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3 items-center py-3 px-4 border-b border-outline-variant/20 last:border-b-0 ${
      highlight ? 'bg-secondary-container/15' : ''
    }`}>
      <div className={`font-medium ${highlight ? 'text-primary' : 'text-on-surface-variant'} ${large ? 'text-base' : 'text-sm'}`}>
        {label}
      </div>
      <div className={`text-center font-data-tabular font-bold ${
        highlight ? 'text-secondary text-lg' : 'text-primary'
      }`}>
        {value}
      </div>
    </div>
  );
}

function OperationIndicator({ op }) {
  return (
    <div className="flex justify-center py-1 px-4">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container text-on-surface-variant font-bold text-sm">
        {op}
      </span>
    </div>
  );
}

export default function MacheteCalculator() {
  const { config } = useCalculatorConsts('machete', MACHETE_CONST_DEFAULTS);
  const [publicDebt, setPublicDebt] = useState(config.defaultPublicDebt);
  const [financialInflation, setFinancialInflation] = useState(config.defaultFinancialInflation);
  const [assetPrice, setAssetPrice] = useState(config.defaultAssetPrice);

  const results = useMemo(() => {
    return computeMachete(
      { publicDebt, financialInflation, assetPrice },
      { toCalculateDebtRatio: config.toCalculateDebtRatio }
    );
  }, [publicDebt, financialInflation, assetPrice, config.toCalculateDebtRatio]);

  const handleReset = () => {
    setPublicDebt(config.defaultPublicDebt);
    setFinancialInflation(config.defaultFinancialInflation);
    setAssetPrice(config.defaultAssetPrice);
  };

  return (
    <div className="space-y-6">
      {/* ── Salmon Card 1: Contextual Explanation of Machete Volatility ── */}
      <div className="bg-secondary-container/20 border border-secondary/30 p-5 rounded-xl space-y-4">
        <h4 className="font-title-lg text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary font-bold">info</span>
          Machete Volatility &amp; Macroeconomic Risk
        </h4>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          Machete is a model for calculating macroeconomic risk potential, similar to standard deviation or volatility. It serves as an initial basis for calculating risk assets such as government bonds and foreign currency, and is also used for rapid risk assessment of stock indices.
        </p>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          Risk potential represents the fluctuation limit of an index, currency, or bond.
        </p>
      </div>

      {/* ── Step 1: Risk Potential (Machete) ── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 1 — Calculate Risk Potential" icon="warning" />
        
        <ParamRow
          label="The Public Debt"
          sublabel="Current public debt coefficient (to update)"
          value={publicDebt}
          onChange={setPublicDebt}
          suffix="%"
        />
        
        <OperationIndicator op="×" />
        
        <ParamRow
          label="To Calculate the Debt Ratio"
          sublabel="Constant debt ratio multiplier"
          value={config.toCalculateDebtRatio}
          onChange={() => {}}
          disabled
        />
        
        <ResultRow
          label="Debt Ratio (Public Debt × Multiplier)"
          value={fmt(results.debtRatio, 5) + '%'}
          highlight
        />
        
        <OperationIndicator op="×" />
        
        <ParamRow
          label="Financial Inflation"
          sublabel="Current financial inflation rate (to update)"
          value={financialInflation}
          onChange={setFinancialInflation}
          suffix="%"
        />
        
        <ResultRow
          label="Risk-indifferent Interest Rate (Debt Ratio × Inflation)"
          value={fmt(results.riskIndifferentRate, 6)}
          highlight
        />
        
        <OperationIndicator op="^2" />
        
        <ResultRow
          label="The Risk Interest Rate (Log-normal mathematical expression: Rate²)"
          value={fmt(results.riskInterestRate, 8)}
        />
        
        <OperationIndicator op="^3" />
        
        <ResultRow
          label="The Log Skew (Mathematical expression of the skew: Rate³)"
          value={fmt(results.logSkew, 6)}
        />
        
        <OperationIndicator op="-" />
        
        <ResultRow
          label="The Range of Risk (Log Skew - Risk Interest Rate)"
          value={fmt(results.rangeOfRisk, 7)}
        />
        
        <OperationIndicator op="√" />
        
        <ResultRow
          label="Machete Potential Risk (Square Root of Risk Range)"
          value={fmt(results.macheteRisk, 8) + '%'}
          highlight
          large
        />
      </div>

      {/* ── Step 2: Range Measurement for a Theoretical Asset ── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 2 — Range Measurement for a Theoretical Asset" icon="expand" color="bg-primary-container" />
        
        <ParamRow
          label="The Market Price of a Theoretical Asset"
          sublabel="Reference asset market price"
          value={assetPrice}
          onChange={setAssetPrice}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-outline-variant border-t border-outline-variant/30">
          {/* Upper Range */}
          <div>
            <div className="px-4 py-2 bg-secondary-container/10 border-b border-outline-variant/20">
              <span className="font-label-sm text-secondary font-bold uppercase tracking-wider">Upper End of the Range</span>
            </div>
            <ResultRow label="Theoretical Price" value={fmt(assetPrice, 2)} />
            <OperationIndicator op="+" />
            <ResultRow label="Machete Volatility" value={fmt(results.macheteRisk, 8)} />
            <ResultRow
              label="Upper Boundary"
              value={fmt(results.upperRange, 6)}
              highlight
              large
            />
            <div className="h-px bg-outline-variant/20 my-1" />
            <ResultRow label="Upward Movement Coeff." value={fmt(results.upwardCoeff, 7)} />
          </div>
          
          {/* Lower Range */}
          <div>
            <div className="px-4 py-2 bg-error-container/20 border-b border-outline-variant/20">
              <span className="font-label-sm text-error font-bold uppercase tracking-wider">Lower End of the Range</span>
            </div>
            <ResultRow label="Theoretical Price" value={fmt(assetPrice, 2)} />
            <OperationIndicator op="-" />
            <ResultRow label="Machete Volatility" value={fmt(results.macheteRisk, 8)} />
            <ResultRow
              label="Lower Boundary"
              value={fmt(results.lowerRange, 8)}
              highlight
              large
            />
            <div className="h-px bg-outline-variant/20 my-1" />
            <ResultRow label="Downward Movement Coeff." value={fmt(results.downwardCoeff, 7)} />
          </div>
        </div>
      </div>

      {/* ── Summary Card ── */}
      <div className="bg-secondary-container/15 border-l-4 border-l-secondary border border-outline-variant p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="font-headline-sm text-primary mb-1">Machete Volatility Summary</h3>
            <p className="text-on-surface-variant text-sm">
              The macroeconomic risk potential limit and asset boundaries.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display-lg text-primary">{fmt(results.macheteRisk, 4)}%</span>
            </div>
            <div className="text-on-surface-variant font-label-sm">
              Macro Volatility Potential
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-outline-variant/30 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white/60 rounded-lg">
            <div className="text-xs text-on-surface-variant mb-1 font-label-sm">Lower Boundary</div>
            <div className="font-data-tabular font-bold text-primary">{fmt(results.lowerRange, 6)}</div>
          </div>
          <div className="p-3 bg-white/60 rounded-lg border-2 border-secondary/20">
            <div className="text-xs text-secondary mb-1 font-label-sm">Machete Risk</div>
            <div className="font-data-tabular font-bold text-secondary text-lg">{fmt(results.macheteRisk, 6)}%</div>
          </div>
          <div className="p-3 bg-white/60 rounded-lg">
            <div className="text-xs text-on-surface-variant mb-1 font-label-sm">Upper Boundary</div>
            <div className="font-data-tabular font-bold text-primary">{fmt(results.upperRange, 6)}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleReset}
            className="flex-1 border border-primary text-primary py-3 px-4 font-bold flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors rounded-lg"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
