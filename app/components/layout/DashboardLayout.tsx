'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BsGrid, 
  BsBullseye,
  BsStar,
  BsChat,
  BsBarChart,
  BsPerson,
  BsGear,
  BsShield,
  BsGraphUp,
  BsClipboardData,
  BsBell,
  BsPeople,
  BsChevronDown,
  BsBoxArrowRight,
  BsBuilding,
  BsClock,
  BsSun,
  BsMoon,
  BsSearch,
  BsList,
  BsX
} from 'react-icons/bs';
import dynamic from 'next/dynamic';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'employee' | 'manager' | 'admin';
}

// Create a client-side only time display component
const TimeDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleString('en-US', options);
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-400">
      <BsClock className="h-4 w-4" />
      <span>{formatDate(currentTime)}</span>
    </div>
  );
};

// Use dynamic import with ssr disabled for the time display
const ClientTimeDisplay = dynamic(() => Promise.resolve(TimeDisplay), {
  ssr: false
});

export default function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [settings, setSettings] = useState({
    systemName: 'Performance Management System',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  });
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch system settings
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getNavItems = () => {
    switch (type) {
      case 'employee':
        return [
          { href: '/dashboard/employee', icon: BsGrid, label: 'Dashboard' },
          { href: '/dashboard/goals/create', icon: BsBullseye, label: 'Goal Setting' },
          { href: '/self-rating', icon: BsStar, label: 'Self Rating' },
          { href: '/feedback', icon: BsChat, label: 'Feedback' },
          { href: '/reports', icon: BsBarChart, label: 'Reports' },
          { href: '/performance-review', icon: BsPerson, label: 'Performance Review' },
        ];
      case 'manager':
        return [
          { href: '/dashboard/manager', icon: BsGrid, label: 'Dashboard' },
          { href: '/approve-goals', icon: BsBullseye, label: 'Goal Approvals' },
          { href: '/rate-employees', icon: BsStar, label: 'Manager Ratings' },
          { href: '/performance-reviews', icon: BsBarChart, label: 'Performance Reviews' },
          { href: '/feedback', icon: BsChat, label: 'Feedback' },
          { href: '/team-management', icon: BsPeople, label: 'Team Management' },
        ];
      case 'admin':
        return [
          { href: '/dashboard/admin/users', label: 'Users', icon: BsPeople },
          { href: '/dashboard/admin/departments', label: 'Departments', icon: BsBuilding },
          { href: '/dashboard/admin/settings', label: 'Settings', icon: BsGear },
          { href: '/dashboard/admin/security', icon: BsShield, label: 'Security' },
          { href: '/dashboard/admin/analytics', icon: BsGraphUp, label: 'Analytics' },
          { href: '/audit-logs', icon: BsClipboardData, label: 'Audit Logs' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const portalTitle = type.charAt(0).toUpperCase() + type.slice(1) + ' Portal';

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/login',
      redirect: true
    });
  };

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-[#1a1c23] transform transition-transform duration-200 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 z-30`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-white">
              {portalTitle}
            </h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <BsX className="w-6 h-6" />
            </button>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-[#2d2f36] hover:text-white'
                  }`}
                >
                  <item.icon className="text-xl" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Sign Out Button */}
            <div className="pt-6 mt-6 border-t border-gray-800">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-400 hover:bg-[#2d2f36] hover:text-white w-full"
              >
                <BsBoxArrowRight className="text-xl" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 right-0 left-0 h-16 bg-[#1a1c23] md:pl-64 z-20">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <BsList className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-white">
                {settings.systemName}
              </h1>
              <ClientTimeDisplay />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white">
              <BsBell className="w-6 h-6" />
            </button>
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 text-gray-400 hover:text-white focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {session?.user?.email?.[0].toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:flex items-center">
                  <span className="text-sm text-white mr-1">{session?.user?.email}</span>
                  <BsChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1c23] rounded-lg shadow-lg py-1 z-50 border border-gray-700">
                  <Link 
                    href="/settings" 
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-[#2d2f36] hover:text-white"
                  >
                    <BsGear className="mr-2" />
                    Settings
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-[#2d2f36] hover:text-white"
                  >
                    <BsBoxArrowRight className="mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:pl-64 pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
} 