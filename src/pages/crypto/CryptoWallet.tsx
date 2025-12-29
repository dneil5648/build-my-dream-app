import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, Wallet } from 'lucide-react';
import { BalanceCard } from '@/components/shared/BalanceCard';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const mockBalances = [
  { asset: 'BTC', balance: '2.45678', usdValue: '$105,432.10', change: '+5.2%', changeType: 'positive' as const },
  { asset: 'ETH', balance: '15.8921', usdValue: '$42,891.50', change: '+2.8%', changeType: 'positive' as const },
  { asset: 'USDC', balance: '50,000.00', usdValue: '$50,000.00', change: '0%', changeType: 'neutral' as const },
];

const mockTransactions = [
  { id: '1', type: 'deposit', asset: 'BTC', amount: '+0.15 BTC', status: 'completed' as const, date: '2024-01-15 14:30' },
  { id: '2', type: 'withdrawal', asset: 'ETH', amount: '-2.5 ETH', status: 'processing' as const, date: '2024-01-15 10:15' },
  { id: '3', type: 'deposit', asset: 'USDC', amount: '+10,000 USDC', status: 'completed' as const, date: '2024-01-14 16:45' },
  { id: '4', type: 'withdrawal', asset: 'BTC', amount: '-0.05 BTC', status: 'completed' as const, date: '2024-01-13 09:20' },
];

const CryptoWallet: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Crypto Wallet</h2>
          <p className="text-muted-foreground">Manage your crypto assets and transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="acc1">
            <SelectTrigger className="w-48 bg-secondary border-border">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="acc1">Main Account</SelectItem>
              <SelectItem value="acc2">Trading Account</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Total Value Card */}
      <div className="glass rounded-2xl p-8 gradient-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground mb-2">Total Portfolio Value</p>
            <h1 className="text-4xl font-bold text-foreground">$198,323.60</h1>
            <p className="text-success mt-2 flex items-center gap-1">
              <span className="text-sm">+$8,542.30 (4.5%)</span>
              <span className="text-xs text-muted-foreground">24h change</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/app/crypto/deposit">
              <Button className="bg-success hover:bg-success/90 text-success-foreground">
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Deposit
              </Button>
            </Link>
            <Link to="/app/crypto/withdraw">
              <Button variant="outline" className="border-border">
                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </Link>
            <Link to="/app/treasury/convert">
              <Button variant="outline" className="border-border">
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Balances Grid */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Your Assets</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockBalances.map((balance) => (
            <BalanceCard
              key={balance.asset}
              asset={balance.asset}
              balance={balance.balance}
              usdValue={balance.usdValue}
              change={balance.change}
              changeType={balance.changeType}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
          <Link to="/app/crypto/history" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {mockTransactions.map((tx) => (
            <div 
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  tx.type === 'deposit' ? 'bg-success/20' : 'bg-warning/20'
                }`}>
                  {tx.type === 'deposit' ? (
                    <ArrowDownToLine className={`h-5 w-5 text-success`} />
                  ) : (
                    <ArrowUpFromLine className={`h-5 w-5 text-warning`} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{tx.amount}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {tx.type} • {tx.date}
                  </p>
                </div>
              </div>
              <TransactionStatusBadge status={tx.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CryptoWallet;
