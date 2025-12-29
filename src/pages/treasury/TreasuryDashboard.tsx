import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Building2, PieChart, TrendingUp, Wallet } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { Button } from '@/components/ui/button';

const mockAssetAllocation = [
  { asset: 'BTC', percentage: 45, value: '$105,432', color: 'bg-crypto-btc' },
  { asset: 'ETH', percentage: 25, value: '$42,891', color: 'bg-crypto-eth' },
  { asset: 'USDC', percentage: 20, value: '$50,000', color: 'bg-crypto-usdc' },
  { asset: 'USD', percentage: 10, value: '$25,000', color: 'bg-success' },
];

const mockAccounts = [
  { id: '1', name: 'Main Treasury', type: 'institution', balance: '$150,000', status: 'active' },
  { id: '2', name: 'Trading Account', type: 'trading', balance: '$45,000', status: 'active' },
  { id: '3', name: 'Reserve Fund', type: 'custody', balance: '$28,323', status: 'active' },
];

const TreasuryDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Treasury Dashboard</h2>
          <p className="text-muted-foreground">Manage assets, conversions, and internal transfers</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/treasury/transfer">
            <Button variant="outline" className="border-border">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer
            </Button>
          </Link>
          <Link to="/app/treasury/convert">
            <Button className="bg-primary hover:bg-primary/90">
              Convert Assets
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Portfolio"
          value="$223,323"
          change="+8.2% MTD"
          changeType="positive"
          icon={Wallet}
        />
        <StatCard
          title="Crypto Holdings"
          value="$198,323"
          change="88.8% of portfolio"
          changeType="neutral"
          icon={PieChart}
        />
        <StatCard
          title="Fiat Balance"
          value="$25,000"
          change="11.2% of portfolio"
          changeType="neutral"
          icon={Building2}
        />
        <StatCard
          title="24h P&L"
          value="+$4,521"
          change="+2.1% today"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Asset Allocation */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-6">Asset Allocation</h3>
          <div className="space-y-4">
            {mockAssetAllocation.map((asset) => (
              <div key={asset.asset} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AssetIcon asset={asset.asset} size="sm" />
                    <span className="font-medium text-foreground">{asset.asset}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-foreground">{asset.value}</span>
                    <span className="text-sm text-muted-foreground ml-2">({asset.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${asset.color} rounded-full transition-all duration-500`}
                    style={{ width: `${asset.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accounts */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Accounts</h3>
            <Link to="/app/treasury/accounts" className="text-sm text-primary hover:underline">
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {mockAccounts.map((account) => (
              <div 
                key={account.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{account.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{account.balance}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                    {account.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-6">Recent Treasury Activity</h3>
        <div className="text-center py-8 text-muted-foreground">
          <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity</p>
          <p className="text-sm">Conversions and transfers will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default TreasuryDashboard;
