import { useMemo, useState } from 'react';
import useCalculatorConsts from '../hooks/useCalculatorConsts';

/**
 * QuickRiskReturnCalculator
 * 
 * Implements the formulas from the "Quick risk return" Excel sheet.
 * 
 * Step 1: Expected Movement and Calculated Index Target
 * Step 2: Inflation Bias Range (determining Upper and Lower bounds)
 */

const QUICK_RISK_DEFAULTS = {
  debtRatioCoeff: 2.5,
  debtRatioDivisor: 100,
  complete100: 100,
  inflationBias: 0.1,
  defaultPublicDebt: 122.49,
  defaultInflationFromPrime: 1.61,
  defaultDjiaStart: 46.053,
};

// ─── Pure calculation model for a single scenario ───────────────────────────
function runModelForInflation({
  publicDebt,
  inflationRate,
  djiaStart,
  debtRatioCoeff,
  debtRatioDivisor,
  complete100,
}) {
  const debt = Math.max(0, publicDebt || 0);
  const inf = Math.max(0, inflationRate || 0);
  const startDjia = Math.max(0, djiaStart || 0);

  const coeff = Math.max(0, debtRatioCoeff || 0);
  const divisor = Math.max(1, debtRatioDivisor || 1);
  const base100 = Math.max(1, complete100 || 1);

  // ── step A ──
  const debtRatio = (debt * coeff) / divisor;
  const riskIndifferentRate = debtRatio * inf;
  const bortoReturn = riskIndifferentRate > 0 ? base100 / riskIndifferentRate : 0;
  const squaredRate = Math.pow(riskIndifferentRate, 2);
  const expectedMovement = squaredRate > 0 ? bortoReturn / squaredRate : 0;
  const djiaTarget = expectedMovement * startDjia;

  return {
    debtRatio,
    riskIndifferentRate,
    bortoReturn,
    squaredRate,
    expectedMovement,
    djiaTarget,
  };
}

// ─── Main calculation engine ─────────────────────────────────────────────────
function computeQuickRiskReturn(
  { publicDebt, inflationFromPrime, djiaStart },
  { debtRatioCoeff, debtRatioDivisor, complete100, inflationBias },
) {
  // Main scenario (Baseline)
  const main = runModelForInflation({
    publicDebt,
    inflationRate: inflationFromPrime,
    djiaStart,
    debtRatioCoeff,
    debtRatioDivisor,
    complete100,
  });

  // Scenario B: Inflation - Bias (gives the HIGHER DJIA target -> Upper Limit)
  const scenarioBInflation = Math.max(0, inflationFromPrime - inflationBias);
  const scenarioB = runModelForInflation({
    publicDebt,
    inflationRate: scenarioBInflation,
    djiaStart,
    debtRatioCoeff,
    debtRatioDivisor,
    complete100,
  });

  // Scenario C: Inflation + Bias (gives the LOWER DJIA target -> Lower Limit)
  const scenarioCInflation = Math.max(0, inflationFromPrime + inflationBias);
  const scenarioC = runModelForInflation({
    publicDebt,
    inflationRate: scenarioCInflation,
    djiaStart,
    debtRatioCoeff,
    debtRatioDivisor,
    complete100,
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
const fmt = (v, decimals = 4) => {
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
          step="0.001"
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
export default function QuickRiskReturnCalculator() {
  const { config } = useCalculatorConsts('quick-risk-return', QUICK_RISK_DEFAULTS);

  const [publicDebt, setPublicDebt] = useState(config.defaultPublicDebt);
  const [inflationFromPrime, setInflationFromPrime] = useState(config.defaultInflationFromPrime);
  const [djiaStart, setDjiaStart] = useState(config.defaultDjiaStart);

  const results = useMemo(() => {
    return computeQuickRiskReturn(
      { publicDebt, inflationFromPrime, djiaStart },
      config
    );
  }, [publicDebt, inflationFromPrime, djiaStart, config]);

  const handleReset = () => {
    setPublicDebt(config.defaultPublicDebt);
    setInflationFromPrime(config.defaultInflationFromPrime);
    setDjiaStart(config.defaultDjiaStart);
  };

  return (
    <div className="space-y-6">
      {/* Description card */}
      <div className="bg-secondary-container/20 border border-secondary/30 p-5 rounded-xl">
        <h4 className="font-title-lg text-primary mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">monitoring</span>
          Quick Risk Return Model
        </h4>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          This model computes risk-indifferent interest rates from public debt and prime-derived inflation, deriving Borto's risk-free returns. By calculating index volatility (squared interest rate), it projects expected target movements and bounds for the DJIA.
        </p>
      </div>

      {/* ── Step 1: Expected Movement and Calculated Index Target ─────── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 1 — Expected Movement & Index Target" icon="calculate" />
        
        <ParamRow
          label="The Public Debt"
          sublabel="Current quarterly federal public debt percentage"
          value={publicDebt}
          onChange={setPublicDebt}
          suffix="%"
        />
        
        <OperationIndicator op="×" />
        
        <ParamRow
          label="Debt Ratio Coefficient"
          sublabel="Real government activity multiplier"
          value={config.debtRatioCoeff}
          onChange={() => {}}
          disabled
        />
        
        <OperationIndicator op="÷" />
        
        <ParamRow
          label="Debt Ratio Divisor"
          sublabel="Scale factor to represent ratio"
          value={config.debtRatioDivisor}
          onChange={() => {}}
          disabled
        />
        
        <ResultRow
          label="Debt Ratio"
          value={fmt(results.main.debtRatio, 5)}
        />
        
        <OperationIndicator op="×" />
        
        <ParamRow
          label="Inflation derived from the Prime"
          sublabel="Priced inflation component from prime rate"
          value={inflationFromPrime}
          onChange={setInflationFromPrime}
          suffix="%"
        />
        
        <ResultRow
          label="Interest Rate (Risk-indifferent)"
          sublabel="Debt Ratio × Inflation"
          value={fmt(results.main.riskIndifferentRate, 5)}
          highlight
        />

        <div className="px-4 py-2 bg-surface-container-low border-y border-outline-variant/10 text-xs text-on-surface-variant font-label-sm">
          Return Calculation: {config.complete100} ÷ Interest Rate
        </div>

        <ResultRow
          label="Borto's Risk-Free Return"
          value={`${fmt(results.main.bortoReturn, 4)}%`}
        />

        <div className="px-4 py-2 bg-surface-container-low border-y border-outline-variant/10 text-xs text-on-surface-variant font-label-sm">
          Risk Calculation: Interest Rate² (Standard Deviation / Volatility equivalent)
        </div>

        <ResultRow
          label="Squared Interest Rate (Risk)"
          value={fmt(results.main.squaredRate, 4)}
        />

        <div className="px-4 py-2 bg-surface-container-low border-y border-outline-variant/10 text-xs text-on-surface-variant font-label-sm">
          Movement Calculation: Borto's Return ÷ Squared Interest Rate
        </div>

        <ResultRow
          label="Expected Movement"
          sublabel="Gross return relative to risk"
          value={fmt(results.main.expectedMovement, 10)}
          highlight
        />

        <OperationIndicator op="×" />

        <ParamRow
          label="DJIA Beginning of a Year"
          sublabel="Dow Jones index level starting base"
          value={djiaStart}
          onChange={setDjiaStart}
        />

        <ResultRow
          label="Calculated Index Target"
          value={fmt(results.main.djiaTarget, 4)}
          highlight
          large
        />
      </div>

      {/* ── Step 2: Inflation Bias Range Comparison ────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 2 — Inflation Bias Bounds (Sensitivity)" icon="compare_arrows" color="bg-primary" />
        <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/30 text-sm text-on-surface-variant">
          Analyzing index sensitivity with an inflation bias of <strong>±{config.inflationBias}%</strong>.
          <div className="text-xs text-error font-semibold mt-1">
            Note: Due to the mathematical formulation, a lower inflation rate results in a higher index target (Upper Bound), and a higher inflation rate results in a lower index target (Lower Bound).
          </div>
        </div>
        
        <div className="divide-y divide-outline-variant/20">
          {/* Upper Scenario: Inflation - Bias */}
          <div className="p-4 bg-secondary-container/10">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-secondary text-sm">Upper Bound (Inflation - Bias)</span>
              <span className="font-data-tabular font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded text-xs">
                {fmt(results.scenarioBInflation, 2)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs text-on-surface-variant">Expected Movement</div>
                <div className="font-data-tabular font-semibold text-primary">{fmt(results.scenarioB.expectedMovement, 8)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-on-surface-variant">DJIA Target</div>
                <div className="font-data-tabular font-bold text-primary text-base">{fmt(results.scenarioB.djiaTarget, 4)}</div>
              </div>
            </div>
          </div>

          {/* Middle Scenario: Main Inflation */}
          <div className="p-4 bg-surface-container-low">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-primary text-sm">Baseline (Current Inflation)</span>
              <span className="font-data-tabular font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                {fmt(inflationFromPrime, 2)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs text-on-surface-variant">Expected Movement</div>
                <div className="font-data-tabular font-semibold text-primary">{fmt(results.main.expectedMovement, 8)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-on-surface-variant">DJIA Target</div>
                <div className="font-data-tabular font-bold text-primary text-base">{fmt(results.main.djiaTarget, 4)}</div>
              </div>
            </div>
          </div>

          {/* Lower Scenario: Inflation + Bias */}
          <div className="p-4 bg-error-container/10">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-error text-sm">Lower Bound (Inflation + Bias)</span>
              <span className="font-data-tabular font-bold text-error bg-error/10 px-2 py-0.5 rounded text-xs">
                {fmt(results.scenarioCInflation, 2)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs text-on-surface-variant">Expected Movement</div>
                <div className="font-data-tabular font-semibold text-primary">{fmt(results.scenarioC.expectedMovement, 8)}</div>
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
              Quick risk-return projection for DJIA target under inflation of {inflationFromPrime}%.
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
            <div className="text-xs text-on-surface-variant mb-1 font-label-sm font-bold">Lower Bound ({fmt(results.scenarioCInflation, 2)}%)</div>
            <div className="font-data-tabular font-bold text-primary">{fmt(results.scenarioC.djiaTarget, 2)}</div>
          </div>
          <div className="p-3 bg-white/60 rounded-lg border-2 border-secondary/20">
            <div className="text-xs text-secondary mb-1 font-label-sm font-bold">Baseline ({fmt(inflationFromPrime, 2)}%)</div>
            <div className="font-data-tabular font-bold text-secondary text-lg">{fmt(results.main.djiaTarget, 2)}</div>
          </div>
          <div className="p-3 bg-white/60 rounded-lg">
            <div className="text-xs text-on-surface-variant mb-1 font-label-sm font-bold">Upper Bound ({fmt(results.scenarioBInflation, 2)}%)</div>
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
