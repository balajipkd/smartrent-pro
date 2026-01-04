import { LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  activeView: 'dashboard' | 'manage-data' | 'payment-entry';
  onViewChange: (view: 'dashboard' | 'manage-data' | 'payment-entry') => void;
}

export function Navbar({ activeView, onViewChange }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg md:text-xl tracking-tight">SmartRent Pro</h1>
        
        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onViewChange('dashboard')}
              className={`px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm ${
                activeView === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onViewChange('manage-data')}
              className={`px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm ${
                activeView === 'manage-data' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Manage Data
            </button>
            <button 
              onClick={() => onViewChange('payment-entry')}
              className={`px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm ${
                activeView === 'payment-entry' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Payment Entry
            </button>
            <button className="px-3 lg:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm">
              Maintenance
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">balaji.pkd@gmail.com</span>
            </div>
            <button className="px-3 lg:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 space-y-2 pb-4">
          <button 
            onClick={() => {
              onViewChange('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full px-4 py-2.5 rounded-lg transition-colors text-left ${
              activeView === 'dashboard' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => {
              onViewChange('manage-data');
              setMobileMenuOpen(false);
            }}
            className={`w-full px-4 py-2.5 rounded-lg transition-colors text-left ${
              activeView === 'manage-data' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Manage Data
          </button>
          <button 
            onClick={() => {
              onViewChange('payment-entry');
              setMobileMenuOpen(false);
            }}
            className={`w-full px-4 py-2.5 rounded-lg transition-colors text-left ${
              activeView === 'payment-entry' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Payment Entry
          </button>
          <button className="w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left">
            Maintenance Entry
          </button>
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-gray-600 px-4">
              <User className="w-4 h-4" />
              <span className="text-sm">balaji.pkd@gmail.com</span>
            </div>
            <button className="w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}