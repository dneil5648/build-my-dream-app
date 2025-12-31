import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Loader2, ExternalLink, Copy, History, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionStatusBadge } from '@/components/shared/TransactionStatusBadge';
import { AssetIcon } from '@/components/shared/AssetIcon';
import { AccountSelector } from '@/components/shared/AccountSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction } from '@/api/types';
import { toast } from 'sonner';

const getNetworkLabel = (network?: string): string => {
  if (!network) return 'Unknown';
  const labels: Record<string, string> = {
    ETHEREUM: 'Ethereum',
    SOLANA: 'Solana',
    STELLAR: 'Stellar',
    BASE: 'Base',
    POLYGON: 'Polygon',
    BITCOIN: 'Bitcoin',
  };
  return labels[network] || network;
};

const getExplorerUrl = (network?: string, txHash?: string): string | null => {
  if (!network || !txHash) return null;
  const explorers: Record<string, string> = {
    ETHEREUM: `https://etherscan.io/tx/${txHash}`,
    SOLANA: `https://solscan.io/tx/${txHash}`,
    STELLAR: `https://stellarchain.io/tx/${txHash}`,
    BASE: `https://basescan.org/tx/${txHash}`,
    POLYGON: `https://polygonscan.com/tx/${txHash}`,
    BITCOIN: `https://blockstream.info/tx/${txHash}`,
  };
  return explorers[network] || null;
};

const CryptoActivity: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const { data: accountsResponse, isLoading: loadingAccounts } = useAccounts({ module: 'CRYPTO_WALLET' });
  const { transactions: allTransactions, isLoading: loadingTransactions } = useTransactions({ 
    limit: 50,
    account_id: selectedAccountId || undefined,
  });

  const accounts = accountsResponse?.data || [];
  
  // Filter for crypto transactions only
  let transactions = allTransactions.filter(
    (tx: Transaction) => tx.transaction_type === 'CRYPTO_DEPOSIT' || tx.transaction_type === 'CRYPTO_WITHDRAWAL'
  );

  // Apply type filter
  if (typeFilter === 'deposits') {
    transactions = transactions.filter((tx: Transaction) => tx.transaction_type === 'CRYPTO_DEPOSIT');
  } else if (typeFilter === 'withdrawals') {
    transactions = transactions.filter((tx: Transaction) => tx.transaction_type === 'CRYPTO_WITHDRAWAL');
  }

  React.useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/crypto">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
          <p className="text-muted-foreground">View all wallet transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          isLoading={loadingAccounts}
          label="Wallet"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="deposits">Deposits Only</SelectItem>
            <SelectItem value="withdrawals">Withdrawals Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <div className="glass rounded-xl p-6">
        {loadingTransactions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm">
              {typeFilter !== 'all' 
                ? `No ${typeFilter} in this wallet yet`
                : 'Your transaction history will appear here'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: Transaction) => {
              const isDeposit = tx.transaction_type === 'CRYPTO_DEPOSIT';
              
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      isDeposit ? 'bg-success/20' : 'bg-warning/20'
                    }`}>
                      {isDeposit ? (
                        <ArrowDownToLine className="h-6 w-6 text-success" />
                      ) : (
                        <ArrowUpFromLine className="h-6 w-6 text-warning" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {isDeposit ? 'Received' : 'Sent'}
                        </p>
                        <AssetIcon asset={tx.source_asset || 'USDC'} size="sm" />
                        <span className="text-sm text-muted-foreground">{tx.source_asset}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tx.network && <span>{getNetworkLabel(tx.network)} • </span>}
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${isDeposit ? 'text-success' : 'text-warning'}`}>
                      {isDeposit ? '+' : '-'}{tx.amount} {tx.source_asset}
                    </p>
                    <TransactionStatusBadge status={tx.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                selectedTransaction?.transaction_type === 'CRYPTO_DEPOSIT' ? 'bg-success/20' : 'bg-warning/20'
              }`}>
                {selectedTransaction?.transaction_type === 'CRYPTO_DEPOSIT' ? (
                  <ArrowDownToLine className="h-5 w-5 text-success" />
                ) : (
                  <ArrowUpFromLine className="h-5 w-5 text-warning" />
                )}
              </div>
              <div>
                <span className="text-foreground">
                  {selectedTransaction?.transaction_type === 'CRYPTO_DEPOSIT' ? 'Deposit' : 'Withdrawal'} Details
                </span>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedTransaction?.created_at && new Date(selectedTransaction.created_at).toLocaleString()}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Amount */}
              <div className="text-center p-6 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AssetIcon asset={selectedTransaction.source_asset || 'USDC'} size="lg" />
                </div>
                <p className={`text-3xl font-bold ${
                  selectedTransaction.transaction_type === 'CRYPTO_DEPOSIT' ? 'text-success' : 'text-warning'
                }`}>
                  {selectedTransaction.transaction_type === 'CRYPTO_DEPOSIT' ? '+' : '-'}
                  {selectedTransaction.amount} {selectedTransaction.source_asset}
                </p>
                <TransactionStatusBadge status={selectedTransaction.status} />
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground">
                    {selectedTransaction.transaction_type === 'CRYPTO_DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Asset</span>
                  <span className="font-medium text-foreground">{selectedTransaction.source_asset}</span>
                </div>
                {selectedTransaction.network && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium text-foreground">{getNetworkLabel(selectedTransaction.network)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Status</span>
                  <TransactionStatusBadge status={selectedTransaction.status} />
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground">{new Date(selectedTransaction.created_at).toLocaleString()}</span>
                </div>
                {selectedTransaction.fee && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="text-foreground">{selectedTransaction.fee} {selectedTransaction.source_asset}</span>
                  </div>
                )}
              </div>

              {/* Transaction Hash */}
              {selectedTransaction.transaction_hash && (
                <div className="p-4 rounded-lg bg-secondary border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Transaction Hash</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-foreground truncate">
                      {selectedTransaction.transaction_hash}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(selectedTransaction.transaction_hash!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {selectedTransaction.network && getExplorerUrl(selectedTransaction.network, selectedTransaction.transaction_hash) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(getExplorerUrl(selectedTransaction.network!, selectedTransaction.transaction_hash!)!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button variant="outline" onClick={() => setSelectedTransaction(null)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CryptoActivity;