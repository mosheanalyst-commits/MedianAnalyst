import { useMemo, useState } from 'react';
import useCalculatorConsts from '../hooks/useCalculatorConsts';

/**
 * BaseModelCalculator
 * 
 * Implements the formulas from "The base model" Excel sheet.
 * 
 * Step 1: Yield Factor
 * Step 2: Gross Return
 * Step 3: Risk Calculation
 * Step 4: Expected Movement Ratio
 * Step 5: Matching to DJIA
 */

const BASE_MODEL_DEFAULTS = {
  governmentActivityLeverage: 2.5,
  defaultM1: 19194,
  defaultM0: 6632,
  defaultGdp: 31490,
  defaultSavings: 841,
  defaultGrowth: 2.4,
  defaultDebt: 122.49,
  defaultPce: 2.9,
  defaultDjiaStart: 48000,
};

// ─── Pure calculation engine ─────────────────────────────────────────────────
function computeBaseModel(
  { m1, m0, gdp, savings, growth, debt, pce, djiaStart },
  { governmentActivityLeverage },
) {
  // Step 1 - Yield Factor
  const cash = Math.max(0, m1 || 0) + Math.max(0, m0 || 0);
  const gdpVal = Math.max(1, gdp || 1);
  const cashToGdp = (cash / gdpVal) * 100;
  const savingsToGdp = (Math.max(0, savings || 0) / gdpVal) * 100;
  const yieldLever = savingsToGdp > 0 ? cashToGdp / savingsToGdp : 0;

  // Step 2 - Gross Return
  const grossReturn = Math.max(0, growth || 0) * yieldLever;

  // Step 3 - Risk Calculation
  const debtRatio = (Math.max(0, debt || 0) * governmentActivityLeverage) / 100;
  const riskIndifferentRate = debtRatio * Math.max(0, pce || 0);
  const riskInterestRate = Math.pow(riskIndifferentRate, 2);

  // Step 4 - Calculate the movement
  const ratioReturnToRisk = riskInterestRate > 0 ? grossReturn / riskInterestRate : 0;

  // Step 5 - Matching to DJIA
  const djiaTarget = ratioReturnToRisk * Math.max(0, djiaStart || 0);

  return {
    cash,
    cashToGdp,
    savingsToGdp,
    yieldLever,
    grossReturn,
    debtRatio,
    riskIndifferentRate,
    riskInterestRate,
    ratioReturnToRisk,
    djiaTarget,
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
export default function BaseModelCalculator() {
  const { config } = useCalculatorConsts('base-model', BASE_MODEL_DEFAULTS);

  const [m1, setM1] = useState(config.defaultM1);
  const [m0, setM0] = useState(config.defaultM0);
  const [gdp, setGdp] = useState(config.defaultGdp);
  const [savings, setSavings] = useState(config.defaultSavings);
  const [growth, setGrowth] = useState(config.defaultGrowth);
  const [debt, setDebt] = useState(config.defaultDebt);
  const [pce, setPce] = useState(config.defaultPce);
  const [djiaStart, setDjiaStart] = useState(config.defaultDjiaStart);

  const results = useMemo(() => {
    return computeBaseModel(
      { m1, m0, gdp, savings, growth, debt, pce, djiaStart },
      config
    );
  }, [m1, m0, gdp, savings, growth, debt, pce, djiaStart, config]);

  const handleReset = () => {
    setM1(config.defaultM1);
    setM0(config.defaultM0);
    setGdp(config.defaultGdp);
    setSavings(config.defaultSavings);
    setGrowth(config.defaultGrowth);
    setDebt(config.defaultDebt);
    setPce(config.defaultPce);
    setDjiaStart(config.defaultDjiaStart);
  };

  return (
    <div className="space-y-6">
      {/* Description card */}
      <div className="bg-secondary-container/20 border border-secondary/30 p-5 rounded-xl">
        <h4 className="font-title-lg text-primary mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">bar_chart</span>
          The Base Model (Return & Risk Equilibrium)
        </h4>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          The base model aggregates monetary aggregates (M1, M0), GDP, and personal savings to establish a yield factor (lever). It balances this return lever with risk metrics (federal debt ratio and PCE inflation) to calculate a final equilibrium index level for the DJIA.
        </p>
        <p className="text-xs text-on-surface-variant font-medium mt-1">
          * Note: Money supply, GDP, and personal savings parameters are entered in <strong>billions of dollars</strong>.
        </p>
      </div>

      {/* ── Step 1: Yield Factor ────────────────────────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 1 — Yield Factor (Liquidity and Savings)" icon="account_balance_wallet" />
        
        <ParamRow
          label="M1 (Amount of Money)"
          sublabel="M1 money supply (in billions)"
          value={m1}
          onChange={setM1}
          suffix="$B"
        />
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2 text-xs font-medium text-secondary">
          <span className="material-symbols-outlined text-sm">link</span>
          <a
            href="https://fred.stlouisfed.org/series/M1SL"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Link to FRED M1SL Data
          </a>
        </div>

        <OperationIndicator op="+" />

        <ParamRow
          label="M0 (Quantitative Expansion)"
          sublabel="Credit and Liquidity Programs (in billions)"
          value={m0}
          onChange={setM0}
          suffix="$B"
        />
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2 text-xs font-medium text-secondary">
          <span className="material-symbols-outlined text-sm">link</span>
          <a
            href="https://www.federalreserve.gov/monetarypolicy/bst_recenttrends.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Link to Fed Liquidity Programs Data
          </a>
        </div>

        <ResultRow
          label="Total Cash (M1 + M0)"
          value={`${fmt(results.cash, 0)} $B`}
        />

        <OperationIndicator op="÷" />

        <ParamRow
          label="Current GDP in Dollars"
          sublabel="Current gross domestic product (in billions)"
          value={gdp}
          onChange={setGdp}
          suffix="$B"
        />
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2 text-xs font-medium text-secondary">
          <span className="material-symbols-outlined text-sm">link</span>
          <a
            href="https://fred.stlouisfed.org/series/GDP"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Link to FRED GDP Data
          </a>
        </div>

        <ResultRow
          label="Percentage of Cash in relation to GDP"
          value={`${fmt(results.cashToGdp, 4)}%`}
        />

        <div className="my-2 border-t border-outline-variant/20"></div>

        <ParamRow
          label="Personal Savings"
          sublabel="Total household personal savings (in billions)"
          value={savings}
          onChange={setSavings}
          suffix="$B"
        />
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2 text-xs font-medium text-secondary">
          <span className="material-symbols-outlined text-sm">link</span>
          <a
            href="https://fred.stlouisfed.org/series/PSAVE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Link to FRED Personal Savings Data
          </a>
        </div>

        <ResultRow
          label="Percentage of Savings in relation to GDP"
          value={`${fmt(results.savingsToGdp, 4)}%`}
          highlight
        />

        <div className="px-4 py-2 bg-surface-container-low border-y border-outline-variant/10 text-xs text-on-surface-variant font-label-sm">
          Lever Calculation: Cash % relative to GDP ÷ Savings % relative to GDP
        </div>

        <ResultRow
          label="The Yield Coefficient or Yield Lever"
          value={fmt(results.yieldLever, 4)}
          highlight
          large
        />
      </div>

      {/* ── Step 2: Gross Return ────────────────────────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 2 — Gross Return" icon="show_chart" color="bg-secondary-container" />
        
        <ParamRow
          label="Fed's Median Annual Growth Estimate (FOMC)"
          sublabel="Median Fed long-term growth estimate"
          value={growth}
          onChange={setGrowth}
          suffix="%"
        />
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2 text-xs font-medium text-secondary">
          <span className="material-symbols-outlined text-sm">link</span>
          <a
            href="https://www.federalreserve.gov/monetarypolicy/fomcprojtabl20260318.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Link to FOMC Growth Projection Data
          </a>
        </div>

        <OperationIndicator op="×" />

        <ResultRow
          label="The Yield Coefficient or Yield Lever"
          value={fmt(results.yieldLever, 4)}
        />

        <ResultRow
          label="Gross Return Before Risk"
          value={`${fmt(results.grossReturn, 4)}%`}
          highlight
          large
        />
      </div>

      {/* ── Step 3: Risk Calculation ────────────────────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 3 — Risk Calculation" icon="warning" color="bg-primary-container" />
        
        <ParamRow
          label="Fed Debt (Total Public Debt)"
          sublabel="Total federal government debt percentage"
          value={debt}
          onChange={setDebt}
          suffix="%"
        />
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2 text-xs font-medium text-secondary">
          <span className="material-symbols-outlined text-sm">link</span>
          <a
            href="https://fred.stlouisfed.org/series/GFDEBTN"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Link to FRED Public Debt Data (GFDEBTN)
          </a>
        </div>

        <OperationIndicator op="×" />

        <ParamRow
          label="Government Activity Leverage"
          sublabel="Activity multiplier coefficient"
          value={config.governmentActivityLeverage}
          onChange={() => {}}
          disabled
        />

        <ResultRow
          label="Debt Ratio (Public Debt × Leverage / 100)"
          value={fmt(results.debtRatio, 5)}
        />

        <OperationIndicator op="×" />

        <ParamRow
          label="PCE Inflation"
          sublabel="Core PCE (Chain-Type Price Index) moving average"
          value={pce}
          onChange={setPce}
          suffix="%"
        />
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2 text-xs font-medium text-secondary">
          <span className="material-symbols-outlined text-sm">link</span>
          <a
            href="https://fred.stlouisfed.org/series/DPCCRV1Q225SBEA"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Link to FRED PCE Inflation Data (DPCCRV1Q225SBEA)
          </a>
        </div>

        <ResultRow
          label="Risk-Indifferent Interest Rate"
          value={fmt(results.riskIndifferentRate, 4)}
        />

        <div className="px-4 py-2 bg-surface-container-low border-y border-outline-variant/10 text-xs text-on-surface-variant font-label-sm">
          Risk Interest Rate: Interest Rate² (Mathematical representation of log-normal)
        </div>

        <ResultRow
          label="Risk Interest Rate"
          value={fmt(results.riskInterestRate, 4)}
          highlight
          large
        />
      </div>

      {/* ── Step 4 & 5: Movement & DJIA Matching ────────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Steps 4 & 5 — Expected Movement & DJIA Equilibrium" icon="balance" color="bg-primary" />
        
        <ResultRow
          label="Gross Return Before Risk"
          value={`${fmt(results.grossReturn, 4)}%`}
        />

        <OperationIndicator op="÷" />

        <ResultRow
          label="Risk Interest Rate"
          value={fmt(results.riskInterestRate, 4)}
        />

        <ResultRow
          label="Expected Movement Ratio (Gross Return / Risk Rate)"
          value={fmt(results.ratioReturnToRisk, 6)}
          highlight
        />

        <OperationIndicator op="×" />

        <ParamRow
          label="DJIA beginning of the year"
          sublabel="Dow Jones Industrial Average opening index level"
          value={djiaStart}
          onChange={setDjiaStart}
        />

        <ResultRow
          label="Equilibrium Target Index Level"
          value={fmt(results.djiaTarget, 2)}
          highlight
          large
        />
      </div>

      {/* ── Summary & Actions ───────────────────────────────────────────── */}
      <div className="bg-secondary-container/15 border-l-4 border-l-secondary border border-outline-variant p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="font-headline-sm text-primary mb-1">Equilibrium Valuation Summary</h3>
            <p className="text-on-surface-variant text-sm">
              Projected DJIA target index based on current liquidity, growth projections, and public debt risk.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <span className="font-display-lg text-primary">{fmt(results.djiaTarget, 2)}</span>
            <div className="text-xs text-on-surface-variant font-label-sm font-semibold">
              DJIA Equilibrium Target
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-outline-variant/30 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white/60 rounded-lg">
            <div className="text-xs text-on-surface-variant mb-1 font-label-sm">Yield Lever</div>
            <div className="font-data-tabular font-bold text-primary">{fmt(results.yieldLever, 2)}</div>
          </div>
          <div className="p-3 bg-white/60 rounded-lg border-2 border-secondary/20">
            <div className="text-xs text-secondary mb-1 font-label-sm">Expected Movement Ratio</div>
            <div className="font-data-tabular font-bold text-secondary text-lg">{fmt(results.ratioReturnToRisk, 4)}</div>
          </div>
          <div className="p-3 bg-white/60 rounded-lg">
            <div className="text-xs text-on-surface-variant mb-1 font-label-sm">Gross Return</div>
            <div className="font-data-tabular font-bold text-primary">{fmt(results.grossReturn, 2)}%</div>
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
