import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, History } from 'lucide-react';
import { AssetIcon } from '@/components/shared/AssetIcon';

const mockBalances = [
  { asset: 'BTC', balance: '0.5432', usdValue: '$23,456.78' },
  { asset: 'ETH', balance: '3.2100', usdValue: '$8,642.10' },
  { asset: 'USDC', balance: '5,000.00', usdValue: '$5,000.00' },
];

const mockActivity = [
  { id: '1', type: 'receive', asset: 'BTC', amount: '+0.05 BTC', date: 'Today, 2:30 PM' },
  { id: '2', type: 'send', asset: 'ETH', amount: '-0.5 ETH', date: 'Yesterday' },
  { id: '3', type: 'swap', asset: 'USDC', amount: '+500 USDC', date: '2 days ago' },
];

const WhiteLabelWallet: React.FC = () => {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header Card - Total Balance */}
      <div className="rounded-3xl bg-gradient-to-br from-module-whitelabel via-module-whitelabel/80 to-module-whitelabel/60 p-8 text-center">
        <p className="text-white/80 text-sm mb-2">Total Balance</p>
        <h1 className="text-4xl font-bold text-white mb-1">$37,098.88</h1>
        <p className="text-white/80 text-sm">+$1,234.56 (3.4%) today</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        <Link to="/app/white-label/receive" className="text-center group">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
            <ArrowDownToLine className="h-6 w-6 text-module-whitelabel" />
          </div>
          <span className="text-xs text-muted-foreground mt-2 block">Receive</span>
        </Link>
        <Link to="/app/white-label/send" className="text-center group">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
            <ArrowUpFromLine className="h-6 w-6 text-module-whitelabel" />
          </div>
          <span className="text-xs text-muted-foreground mt-2 block">Send</span>
        </Link>
        <Link to="/app/white-label/swap" className="text-center group">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
            <RefreshCw className="h-6 w-6 text-module-whitelabel" />
          </div>
          <span className="text-xs text-muted-foreground mt-2 block">Swap</span>
        </Link>
        <Link to="/app/white-label/activity" className="text-center group">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center group-hover:bg-module-whitelabel/10 group-hover:border-module-whitelabel/50 transition-colors">
            <History className="h-6 w-6 text-module-whitelabel" />
          </div>
          <span className="text-xs text-muted-foreground mt-2 block">Activity</span>
        </Link>
      </div>

      {/* Assets */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Your Assets</h3>
        <div className="space-y-4">
          {mockBalances.map((item) => (
            <div key={item.asset} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AssetIcon asset={item.asset} size="md" />
                <div>
                  <p className="font-medium text-foreground">{item.asset}</p>
                  <p className="text-sm text-muted-foreground">{item.balance}</p>
                </div>
              </div>
              <p className="font-semibold text-foreground">{item.usdValue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
          <Link to="/app/white-label/activity" className="text-sm text-module-whitelabel">
            See all
          </Link>
        </div>
        <div className="space-y-4">
          {mockActivity.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  tx.type === 'receive' ? 'bg-success/20' : 
                  tx.type === 'send' ? 'bg-warning/20' : 'bg-module-whitelabel/20'
                }`}>
                  {tx.type === 'receive' && <ArrowDownToLine className="h-5 w-5 text-success" />}
                  {tx.type === 'send' && <ArrowUpFromLine className="h-5 w-5 text-warning" />}
                  {tx.type === 'swap' && <RefreshCw className="h-5 w-5 text-module-whitelabel" />}
                </div>
                <div>
                  <p className="font-medium text-foreground capitalize">{tx.type}</p>
                  <p className="text-sm text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <p className={`font-semibold ${
                tx.type === 'receive' || tx.type === 'swap' ? 'text-success' : 'text-foreground'
              }`}>
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelWallet;
