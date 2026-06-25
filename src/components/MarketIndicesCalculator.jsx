import { useMemo, useState } from 'react';
import useCalculatorConsts from '../hooks/useCalculatorConsts';

const MARKET_INDICES_CONST_DEFAULTS = {
  naturalNumberE: 2.71,
  defaultMarketableAssets: 93900.00,
  defaultGDP: 31442,
  defaultDjiaMovingAverage: 48321,
};

// ─── Pure Calculation Engine ─────────────────────────────────────────────────
function computeMarketIndices(
  { marketableAssets, currentGDP, djiaMovingAverage },
  { naturalNumberE }
) {
  const assets = Math.max(0, marketableAssets || 0);
  const gdp = Math.max(0.0001, currentGDP || 0.0001);
  const djiaMa = Math.max(0, djiaMovingAverage || 0);

  // Step 1: Ratio of financial assets to GDP = assets / gdp
  const ratioAssetsToGdp = assets / gdp;

  // Step 2: Ratio actual to equilibrium = e / ratioAssetsToGdp
  const ratioActualToEquilibrium = ratioAssetsToGdp > 0 ? naturalNumberE / ratioAssetsToGdp : 0;

  // Step 3: Economic rate of DJIA = ratioActualToEquilibrium * djiaMa
  const economicDjiaRate = ratioActualToEquilibrium * djiaMa;

  return {
    ratioAssetsToGdp,
    ratioActualToEquilibrium,
    economicDjiaRate,
  };
}

// ─── Formatting Helper ───────────────────────────────────────────────────────
const fmt = (v, decimals = 2) => {
  if (v === null || v === undefined || isNaN(v) || !isFinite(v)) return '—';
  return v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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

export default function MarketIndicesCalculator() {
  const { config } = useCalculatorConsts('market-indices', MARKET_INDICES_CONST_DEFAULTS);
  const [marketableAssets, setMarketableAssets] = useState(config.defaultMarketableAssets);
  const [currentGDP, setCurrentGDP] = useState(config.defaultGDP);
  const [djiaMovingAverage, setDjiaMovingAverage] = useState(config.defaultDjiaMovingAverage);

  const results = useMemo(() => {
    return computeMarketIndices(
      { marketableAssets, currentGDP, djiaMovingAverage },
      { naturalNumberE: config.naturalNumberE }
    );
  }, [marketableAssets, currentGDP, djiaMovingAverage, config.naturalNumberE]);

  const handleReset = () => {
    setMarketableAssets(config.defaultMarketableAssets);
    setCurrentGDP(config.defaultGDP);
    setDjiaMovingAverage(config.defaultDjiaMovingAverage);
  };

  return (
    <div className="space-y-6">
      {/* ── Salmon Card 1: Contextual Explanation of Equilibrium ── */}
      <div className="bg-secondary-container/20 border border-secondary/30 p-5 rounded-xl space-y-4">
        <h4 className="font-title-lg text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary font-bold">info</span>
          Financial Assets to GDP Equilibrium
        </h4>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          The equilibrium ratio between tradable financial assets and GDP is 2.71. Every dollar in the economy generates 2.71 dollars in the capital market.
        </p>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          All numbers in this calculator are in billions of dollars.
        </p>
      </div>

      {/* ── Step 1: Calculate Ratio ── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 1 — Calculate Ratio of Financial Assets to GDP" icon="analytics" />
        
        <ParamRow
          label="Total Marketable Financial Assets"
          sublabel="Based on Federal Reserve Report Z.1, Table L.101"
          value={marketableAssets}
          onChange={setMarketableAssets}
          suffix="$B"
        />
        
        <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2 text-xs font-medium text-secondary">
          <span className="material-symbols-outlined text-sm">link</span>
          <a
            href="https://fred.stlouisfed.org/release/tables?eid=804144&rid=52"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Link to the FRED data site (Table L.101)
          </a>
        </div>
        
        <OperationIndicator op="÷" />
        
        <ParamRow
          label="Current GDP in Dollars"
          sublabel="Quarterly GDP parameter"
          value={currentGDP}
          onChange={setCurrentGDP}
          suffix="$B"
        />
        
        <ResultRow
          label="The current ratio of financial assets to GDP"
          value={fmt(results.ratioAssetsToGdp, 2)}
          highlight
          large
        />
      </div>

      {/* ── Step 2: Ratio Actual to Equilibrium ── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 2 — Ratio Between Actual and Equilibrium Assets" icon="balance" color="bg-primary-container" />
        
        <ParamRow
          label="The Natural Number e"
          sublabel="Constant coefficient of equilibrium"
          value={config.naturalNumberE}
          onChange={() => {}}
          disabled
        />
        
        <OperationIndicator op="÷" />
        
        <ResultRow
          label="The current ratio of financial assets to GDP"
          value={fmt(results.ratioAssetsToGdp, 2)}
        />
        
        <ResultRow
          label="The ratio between actual assets and equilibrium assets"
          value={fmt(results.ratioActualToEquilibrium, 2)}
          highlight
          large
        />
      </div>

      {/* ── Step 3: Economic Rate Forecast ── */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <StepHeader label="Step 3 — Forecast Economic Rate of DJIA" icon="show_chart" color="bg-primary" />
        
        <ResultRow
          label="The ratio between actual assets and equilibrium assets"
          value={fmt(results.ratioActualToEquilibrium, 2)}
        />
        
        <OperationIndicator op="×" />
        
        <ParamRow
          label="DJIA Moving Average Rate"
          sublabel="Moving average rate for the previous quarter"
          value={djiaMovingAverage}
          onChange={setDjiaMovingAverage}
        />
        
        <ResultRow
          label="The economic rate of the DJIA index according to the equilibrium ratio"
          value={fmt(results.economicDjiaRate, 2)}
          highlight
          large
        />
      </div>

      {/* ── Salmon Card 2: Machete Calculator Guidelines ── */}
      <div className="bg-secondary-container/20 border border-secondary/30 p-5 rounded-xl space-y-4">
        <h4 className="font-title-lg text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary font-bold">query_stats</span>
          Guidance for Machete Volatility Ranges
        </h4>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          You can enter the economic rate found here into the Machete calculator under the parameter "The market price of a theoretical asset" to find the range. Note the use of financial inflation.
        </p>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          For example: If the risk coefficient is 1.0977 (calculated based on debt to GDP 122.49% and financial inflation 1.61%), the upper range comes out to 48,131.95 and the lower range comes out to 39,945.24.
        </p>
      </div>

      {/* ── Reset Controls ── */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 border border-primary text-primary py-3 px-4 font-bold flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors rounded-lg"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
