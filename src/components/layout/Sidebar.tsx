import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Settings, 
  ArrowDownToLine, 
  Wallet, 
  BarChart3, 
  ArrowUpFromLine,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import paxosLogo from '@/assets/paxos-logo.svg';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Config', href: '/app/config', icon: Settings, color: 'module-config' },
  { name: 'Pay-ins', href: '/app/pay-ins', icon: ArrowDownToLine, color: 'module-payins' },
  { name: 'Crypto Wallet', href: '/app/crypto', icon: Wallet, color: 'module-crypto' },
  { name: 'Treasury', href: '/app/treasury', icon: BarChart3, color: 'module-treasury' },
  { name: 'Pay-outs', href: '/app/payouts', icon: ArrowUpFromLine, color: 'module-payouts' },
  { name: 'White Label', href: '/app/white-label', icon: Layers, color: 'module-whitelabel' },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-primary/20">
          {!collapsed && (
            <div className="flex items-center">
              <img src={paxosLogo} alt="Paxos" className="h-8" />
            </div>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/20 border-l-4 border-primary text-sidebar-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-primary/10 hover:text-sidebar-foreground border-l-4 border-transparent"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary" : "text-primary"
                )} />
                {!collapsed && (
                  <span className="font-medium truncate">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-primary/20" />

        {/* Footer */}
        <div className="p-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
              collapsed && "justify-center"
            )}
            onClick={logout}
          >
            <LogOut className="h-5 w-5 text-destructive" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};
