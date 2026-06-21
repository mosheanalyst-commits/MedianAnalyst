import { useMemo, useState } from 'react';
import useCalculatorConsts from '../hooks/useCalculatorConsts';

/**
 * LongTermReturnCalculator
 * 
 * Implements the formulas from the "Long-term investor return" Excel sheet.
 * 
 * Step 1: Yield Coefficient Calculation
 * Step 2: Time Factor and DJIA Target Rate
 * Step 3: Inflation Bias Range Comparison
 */

const LONG_TERM_CONST_DEFAULTS = {
  fixedFinancialCoefficient: 2.71,
  riskFactor: 180,
  anchorYear: 1932,
  djiaValue1932: 44,
  inflationBias: 0.1,
  defaultRealGrowth: 1.8,
  defaultInflation: 2.8,
  defaultCurrentYear: 2026,
};

// ─── Pure calculation model for a single scenario ───────────────────────────
function runModelForInflation({
  realGrowth,
  inflationRate,
  currentYear,
  fixedFinancialCoefficient,
  riskFactor,
  anchorYear,
  djiaValue1932,
}) {
  const rg = Math.max(0, realGrowth || 0);
  const inf = Math.max(0, inflationRate || 0);
  const year = Math.max(1800, currentYear || 0);

  const coeff = Math.max(0, fixedFinancialCoefficient || 0);
  const risk = Math.max(1, riskFactor || 1);
  const anchor = Math.max(1800, anchorYear || 0);
  const djia1932 = Math.max(0, djiaValue1932 || 0);

  // Step 1
  const nominalGrowth = rg * inf;
  const annualReturnBeforeRisk = nominalGrowth * coeff;
  const internalMiddle = annualReturnBeforeRisk / risk;
  const annualReturnAfterRisk = internalMiddle * 100;
  const yieldCoeff = internalMiddle + 1;

  // Step 2
  const yearsDiff = Math.max(0, year - anchor);
  const yearsSince1932 = yearsDiff + 1;
  const timeFactor = yearsSince1932 + 1;

  const cumulativeReturn = Math.pow(yieldCoeff, timeFactor);
  const djiaTarget = cumulativeReturn * djia1932;

  return {
    nominalGrowth,
    annualReturnBeforeRisk,
    internalMiddle,
    annualReturnAfterRisk,
    yieldCoeff,
    yearsDiff,
    yearsSince1932,
    timeFactor,
    cumulativeReturn,
    djiaTarget,
  };
}

// ─── Main calculation engine ─────────────────────────────────────────────────
function computeLongTermReturn(
  { realGrowth, inflation, currentYear },
  { fixedFinancialCoefficient, riskFactor, anchorYear, djiaValue1932, inflationBias },
) {
  // Main scenario (Scenario A)
  const main = runModelForInflation({
    realGrowth,
    inflationRate: inflation,
    currentYear,
    fixedFinancialCoefficient,
    riskFactor,
    anchorYear,
    djiaValue1932,
  });

  // Scenario B: Inflation - Bias
  const scenarioBInflation = Math.max(0, inflation - inflationBias);
  const scenarioB = runModelForInflation({
    realGrowth,
    inflationRate: scenarioBInflation,
    currentYear,
    fixedFinancialCoefficient,
    riskFactor,
    anchorYear,
    djiaValue1932,
  });

  // Scenario C: Inflation - 2 * Bias
  const scenarioCInflation = Math.max(0, inflation - 2 * inflationBias);
  const scenarioC = runModelForInflation({
    realGrowth,
    inflationRate: scenarioCInflation,
    currentYear,
    fixedFinancialCoefficient,
    riskFactor,
    anchorYear,
    djiaValue1932,
  });

  return {
    main,
    scenarioBInflation,
    scenarioB,
    scenarioCInflation,
    scenarioC,
  };
}

// ─── Formatting helpers ──────────────────────────────────────────────────────
const fmt = (v, decimals = 2) => {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// ─── Sub-components ─────────────────────────────────────────────────────────
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
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3 items-center py-3 px-4 border-b border-outline-variant/30 last:border-b-0">
      <div>
        <div className="font-bold text-primary text-sm">{label}</div>
        {sublabel && (
          <div className="text-xs text-on-surface-variant mt-0.5">{sublabel}</div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="0.01"
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
    <div className={`grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3 items-center py-3 px-4 border-b border-outline-variant/20 last:border-b-0 ${
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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LongTermReturnCalculator() {
  const { config } = useCalculatorConsts('long-term-return', LONG_TERM_CONST_DEFAULTS);
  
  const [realGrowth, setRealGrowth] = useState(config.defaultRealGrowth);
  const [inflation, setInflation] = useState(config.defaultInflation);
  const [currentYear, setCurrentYear] = useState(config.defaultCurrentYear);

  const results = useMemo(() => {
    return computeLongTermReturn(
      { realGrowth, inflation, currentYear },
      config
    );
  }, [realGrowth, inflation, currentYear, config]);

  const handleReset = () => {
    setRealGrowth(config.defaultRealGrowth);
    setInflation(config.defaultInflation);
    setCurrentYear(config.defaultCurrentYear);
  };

  return (
    <div className="space-y-6">
      {/* Description card */}
      <div className="bg-secondary-container/20 border border-secondary/30 p-5 rounded-xl">
        <h4 className="font-title-lg text-primary mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">trending_up</span>
          Long-Term Investor Return Model
        </h4>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          This model assumes the stock index is eternal, encompassing both nominal return and risk. It calculates the cumulative return after risk from an index base point in 1932 to derive the DJIA target rate, and measures sensitivities across different inflation levels.
        </p>
      </div>

      {/* ── Step 1: Yield Coefficient ──────────────────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 1 — Yield Coefficient Calculation" icon="percent" />
        
        <ParamRow
          label="Real Growth (RG)"
          sublabel="Long-term real growth estimate (FOMC)"
          value={realGrowth}
          onChange={setRealGrowth}
          suffix="%"
        />
        
        <OperationIndicator op="×" />
        
        <ParamRow
          label="Inflation (PCE)"
          sublabel="PCE index average (simple average of last 40 quarters)"
          value={inflation}
          onChange={setInflation}
          suffix="%"
        />
        
        <ResultRow
          label="Nominal Growth"
          value={`${fmt(results.main.nominalGrowth, 4)}%`}
        />
        
        <OperationIndicator op="×" />
        
        <ParamRow
          label="Fixed Financial Coefficient"
          sublabel="Constant multiplying nominal growth"
          value={config.fixedFinancialCoefficient}
          onChange={() => {}}
          disabled
        />
        
        <ResultRow
          label="Annual Return before Risk"
          value={`${fmt(results.main.annualReturnBeforeRisk, 4)}%`}
        />
        
        <OperationIndicator op="÷" />
        
        <ParamRow
          label="Risk Factor for Investor"
          sublabel="Divider factor compensating for risk premium"
          value={config.riskFactor}
          onChange={() => {}}
          disabled
        />
        
        <ResultRow
          label="Annual Percentage Return (after risk)"
          value={`${fmt(results.main.annualReturnAfterRisk, 4)}%`}
          highlight
        />
        
        <ResultRow
          label="Yield Coefficient"
          sublabel="Used for compound interest calculation"
          value={fmt(results.main.yieldCoeff, 5)}
          highlight
          large
        />
      </div>

      {/* ── Step 2: Time Factor & Target Rate ──────────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 2 — Time Factor & DJIA Target Rate" icon="timeline" color="bg-primary-container" />
        
        <ParamRow
          label="Current Year"
          sublabel="Target year to project the Dow Jones index"
          value={currentYear}
          onChange={setCurrentYear}
        />
        
        <OperationIndicator op="-" />
        
        <ParamRow
          label="Anchor Year"
          sublabel="Dow Jones historical index bottom"
          value={config.anchorYear}
          onChange={() => {}}
          disabled
        />
        
        <ResultRow
          label="Years Difference"
          value={fmt(results.main.yearsDiff, 0)}
        />
        
        <ResultRow
          label="Number of Years since 1932 (inclusive)"
          value={fmt(results.main.yearsSince1932, 0)}
        />
        
        <ResultRow
          label="Time Factor (Years since 1932 + 1)"
          value={fmt(results.main.timeFactor, 0)}
          highlight
        />
        
        <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/20">
          <div className="text-xs text-on-surface-variant font-label-sm">
            Operation: Yield Coefficient ^ Time Factor
          </div>
        </div>
        
        <ResultRow
          label="Cumulative Return after Risk"
          value={fmt(results.main.cumulativeReturn, 4)}
        />
        
        <OperationIndicator op="×" />
        
        <ParamRow
          label="DJIA Value in 1932"
          sublabel="Dow Jones index level at anchor year"
          value={config.djiaValue1932}
          onChange={() => {}}
          disabled
        />
        
        <ResultRow
          label={`DJIA Target Rate in ${currentYear}`}
          value={fmt(results.main.djiaTarget, 4)}
          highlight
          large
        />
      </div>

      {/* ── Step 3: Inflation Bias Range Comparison ────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 3 — Inflation Bias Range (Sensitivity)" icon="compare_arrows" color="bg-primary" />
        <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/30 text-sm text-on-surface-variant">
          Analyzing index sensitivity with an inflation bias of <strong>±{config.inflationBias}%</strong>.
        </div>
        
        <div className="divide-y divide-outline-variant/20">
          {/* Upper Scenario: Main Inflation */}
          <div className="p-4 bg-secondary-container/10">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-secondary text-sm">Scenario A (Baseline Inflation)</span>
              <span className="font-data-tabular font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded text-xs">
                {fmt(inflation, 2)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs text-on-surface-variant">Yield Coeff</div>
                <div className="font-data-tabular font-semibold text-primary">{fmt(results.main.yieldCoeff, 5)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-on-surface-variant">DJIA Target</div>
                <div className="font-data-tabular font-bold text-primary text-base">{fmt(results.main.djiaTarget, 4)}</div>
              </div>
            </div>
          </div>

          {/* Middle Scenario: Inflation - Bias */}
          <div className="p-4 bg-surface-container-low">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-primary text-sm">Scenario B (Inflation - Bias)</span>
              <span className="font-data-tabular font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                {fmt(results.scenarioBInflation, 2)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs text-on-surface-variant">Yield Coeff</div>
                <div className="font-data-tabular font-semibold text-primary">{fmt(results.scenarioB.yieldCoeff, 5)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-on-surface-variant">DJIA Target</div>
                <div className="font-data-tabular font-bold text-primary text-base">{fmt(results.scenarioB.djiaTarget, 4)}</div>
              </div>
            </div>
          </div>

          {/* Lower Scenario: Inflation - 2*Bias */}
          <div className="p-4 bg-error-container/10">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-error text-sm">Scenario C (Inflation - 2 × Bias)</span>
              <span className="font-data-tabular font-bold text-error bg-error/10 px-2 py-0.5 rounded text-xs">
                {fmt(results.scenarioCInflation, 2)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs text-on-surface-variant">Yield Coeff</div>
                <div className="font-data-tabular font-semibold text-primary">{fmt(results.scenarioC.yieldCoeff, 5)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-on-surface-variant">DJIA Target</div>
                <div className="font-data-tabular font-bold text-error text-base">{fmt(results.scenarioC.djiaTarget, 4)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary & Actions ───────────────────────────────────────────── */}
      <div className="bg-secondary-container/15 border-l-4 border-l-secondary border border-outline-variant p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="font-headline-sm text-primary mb-1">DJIA Target Projection</h3>
            <p className="text-on-surface-variant text-sm">
              Long-term valuation target for year {currentYear} under base inflation of {inflation}%.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <span className="font-display-lg text-primary">{fmt(results.main.djiaTarget, 2)}</span>
            <div className="text-xs text-on-surface-variant font-label-sm font-semibold">
              DJIA Target Rate
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-outline-variant/30 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white/60 rounded-lg">
            <div className="text-xs text-on-surface-variant mb-1 font-label-sm font-bold">Scenario C ({fmt(results.scenarioCInflation, 2)}%)</div>
            <div className="font-data-tabular font-bold text-primary">{fmt(results.scenarioC.djiaTarget, 2)}</div>
          </div>
          <div className="p-3 bg-white/60 rounded-lg border-2 border-secondary/20">
            <div className="text-xs text-secondary mb-1 font-label-sm font-bold">Scenario A (Base {fmt(inflation, 2)}%)</div>
            <div className="font-data-tabular font-bold text-secondary text-lg">{fmt(results.main.djiaTarget, 2)}</div>
          </div>
          <div className="p-3 bg-white/60 rounded-lg">
            <div className="text-xs text-on-surface-variant mb-1 font-label-sm font-bold">Scenario B ({fmt(results.scenarioBInflation, 2)}%)</div>
            <div className="font-data-tabular font-bold text-primary">{fmt(results.scenarioB.djiaTarget, 2)}</div>
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
