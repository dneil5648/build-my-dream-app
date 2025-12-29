import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const routeTitles: Record<string, string> = {
  '/app/config': 'Configuration',
  '/app/pay-ins': 'Pay-ins',
  '/app/crypto': 'Crypto Wallet',
  '/app/treasury': 'Treasury',
  '/app/payouts': 'Pay-outs',
  '/app/white-label': 'White Label Wallet',
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getTitle = () => {
    for (const [path, title] of Object.entries(routeTitles)) {
      if (location.pathname.startsWith(path)) {
        return title;
      }
    }
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        {/* Title */}
        <h1 className="text-xl font-semibold text-foreground">{getTitle()}</h1>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center text-primary-foreground">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden md:inline-block">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{user?.email}</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
