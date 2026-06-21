import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import BankValuePage from './pages/BankValuePage';
import MarketValuePage from './pages/MarketValuePage';
import InflationPage from './pages/InflationPage';
import MachetePage from './pages/MachetePage';
import MarketIndicesPage from './pages/MarketIndicesPage';
import NewsletterPage from './pages/NewsletterPage';
import PlaceholderPage from './pages/PlaceholderPage';
import CalculatorsDashboardPage from './pages/CalculatorsDashboardPage';
import AdminBlogsPage from './pages/AdminBlogsPage';
import AdminCalculatorConstsPage from './pages/AdminCalculatorConstsPage';
import AdminShellPage from './pages/AdminShellPage';
import LongTermReturnPage from './pages/LongTermReturnPage';
import QuickRiskReturnPage from './pages/QuickRiskReturnPage';
import BaseModelPage from './pages/BaseModelPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="calculators" element={<CalculatorsDashboardPage />} />
        <Route path="calculators/bank-value" element={<BankValuePage />} />
        <Route path="calculators/market-shares" element={<MarketValuePage />} />
        <Route path="calculators/inflation" element={<InflationPage />} />
        <Route path="calculators/machete" element={<MachetePage />} />
        <Route path="calculators/market-indices" element={<MarketIndicesPage />} />
        <Route path="calculators/long-term-return" element={<LongTermReturnPage />} />
        <Route path="calculators/quick-risk-return" element={<QuickRiskReturnPage />} />
        <Route path="calculators/base-model" element={<BaseModelPage />} />
        <Route path="calculators/:calculatorId" element={<PlaceholderPage />} />
        <Route path="newsletter" element={<NewsletterPage />} />
      </Route>
      <Route path="sodimeod" element={<AdminShellPage />}>
        <Route index element={<Navigate to="blogs" replace />} />
        <Route path="blogs" element={<AdminBlogsPage />} />
        <Route path="calculator-consts" element={<AdminCalculatorConstsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
