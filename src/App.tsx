import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// App pages
import ConfigPage from "./pages/config/ConfigPage";
import PayInsDashboard from "./pages/payins/PayInsDashboard";
import CreateDepositInstructions from "./pages/payins/CreateDepositInstructions";
import SandboxDeposit from "./pages/payins/SandboxDeposit";
import CryptoWallet from "./pages/crypto/CryptoWallet";
import CryptoDeposit from "./pages/crypto/CryptoDeposit";
import CryptoWithdraw from "./pages/crypto/CryptoWithdraw";
import TreasuryDashboard from "./pages/treasury/TreasuryDashboard";
import TreasuryConvert from "./pages/treasury/TreasuryConvert";
import PayoutsDashboard from "./pages/payouts/PayoutsDashboard";
import CreatePayout from "./pages/payouts/CreatePayout";
import WhiteLabelWallet from "./pages/whitelabel/WhiteLabelWallet";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected app routes */}
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Navigate to="/app/config" replace />} />
              
              {/* Config */}
              <Route path="config" element={<ConfigPage />} />
              <Route path="config/paxos" element={<ConfigPage />} />
              
              {/* Pay-ins */}
              <Route path="pay-ins" element={<PayInsDashboard />} />
              <Route path="pay-ins/dashboard" element={<PayInsDashboard />} />
              <Route path="pay-ins/create" element={<CreateDepositInstructions />} />
              <Route path="pay-ins/sandbox" element={<SandboxDeposit />} />
              <Route path="pay-ins/history" element={<PayInsDashboard />} />
              
              {/* Crypto Wallet */}
              <Route path="crypto" element={<CryptoWallet />} />
              <Route path="crypto/wallet" element={<CryptoWallet />} />
              <Route path="crypto/deposit" element={<CryptoDeposit />} />
              <Route path="crypto/withdraw" element={<CryptoWithdraw />} />
              <Route path="crypto/addresses" element={<CryptoWallet />} />
              
              {/* Treasury */}
              <Route path="treasury" element={<TreasuryDashboard />} />
              <Route path="treasury/dashboard" element={<TreasuryDashboard />} />
              <Route path="treasury/convert" element={<TreasuryConvert />} />
              <Route path="treasury/transfer" element={<TreasuryDashboard />} />
              <Route path="treasury/accounts" element={<TreasuryDashboard />} />
              
              {/* Payouts */}
              <Route path="payouts" element={<PayoutsDashboard />} />
              <Route path="payouts/dashboard" element={<PayoutsDashboard />} />
              <Route path="payouts/create" element={<CreatePayout />} />
              <Route path="payouts/bank-accounts" element={<PayoutsDashboard />} />
              <Route path="payouts/bank-accounts/new" element={<CreatePayout />} />
              <Route path="payouts/history" element={<PayoutsDashboard />} />
              
              {/* White Label */}
              <Route path="white-label" element={<WhiteLabelWallet />} />
              <Route path="white-label/wallet" element={<WhiteLabelWallet />} />
              <Route path="white-label/receive" element={<WhiteLabelWallet />} />
              <Route path="white-label/send" element={<WhiteLabelWallet />} />
              <Route path="white-label/swap" element={<WhiteLabelWallet />} />
              <Route path="white-label/activity" element={<WhiteLabelWallet />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
