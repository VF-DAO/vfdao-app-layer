'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Coins, Compass, Github, Home, Menu, Send, ShoppingBag, User, Vote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { ThemeToggle } from '@/components/theme-toggle';
import { WalletButton } from '@/features/wallet';
import { useWallet } from '@/features/wallet';
import Logo from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { Divider } from '@/components/ui/divider';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { iconContainerVariants, iconVariants } from '@/components/ui/icon-container';

// Admin accounts that can access coming soon features
const ADMIN_ACCOUNTS = ['greenghost.near'];

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  adminOnly?: boolean; // Only admins can click when comingSoon
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: '$VF', href: '/vf', icon: Coins },
  { label: 'DAO', href: '/dao', icon: Vote },
  { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag, comingSoon: true, adminOnly: true },
  { label: 'Profile', href: '/profile', icon: User }
];

// Helper functions for nav icon styling
const getNavIconContainerClasses = (isActive: boolean, size: 'sm' | 'md' | 'lg' = 'lg') => {
  return iconContainerVariants({ variant: isActive ? 'active' : 'inactive', size });
};

const getNavIconClasses = (isActive: boolean) => {
  return iconVariants({ variant: isActive ? 'active' : 'inactive' });
};

// Static variants for disabled items
const inactiveIconContainerClasses = iconContainerVariants({ variant: 'inactiveStatic', size: 'lg' });
const inactiveIconClasses = iconVariants({ variant: 'inactiveStatic' });

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  pathname: string;
  onNavInteraction?: () => void;
  isAdmin?: boolean;
  accountId?: string | null;
}

function Sidebar({ isOpen, onClose, activeSection, pathname, onNavInteraction, isAdmin = false, accountId }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when sidebar is open
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClickOutside]);

  const _scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />

          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 h-full w-80 max-w-[90vw] bg-background border-r border-border shadow-xl z-50 flex flex-col"
          >
            {/* Header - Profile */}
            <div className="flex items-center justify-between p-6">
              <Link href="/profile" onClick={onClose} className="flex items-center gap-3 group">
                <ProfileAvatar
                  accountId={accountId || ''}
                  size="md"
                  className="w-10 h-10 ring-2 ring-background"
                />
                <span className="font-semibold text-sm truncate max-w-[160px] group-hover:text-primary transition-colors">
                  {accountId?.replace('.near', '') || 'Profile'}
                </span>
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-md transition-colors group"
                aria-label="Close sidebar"
              >
                <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" />
              </button>
            </div>
            {/* Divider */}
            <div className="px-6">
              <Divider />
            </div>

            {/* Navigation Items - Scrollable on short screens */}
            <div className="flex-1 py-6 overflow-y-auto min-h-0">
              <nav className="px-4 space-y-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.href;
                  const canAccess = !item.comingSoon || (item.adminOnly && isAdmin);
                  
                  if (item.comingSoon && !canAccess) {
                    // Coming soon - not clickable for non-admins
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 w-full group opacity-60 cursor-not-allowed"
                      >
                        <div className={`${inactiveIconContainerClasses}`}>
                          <Icon size={20} className={inactiveIconClasses} />
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                          <Badge variant="muted" className="text-[10px] px-2 py-0.5">Soon</Badge>
                        </div>
                      </div>
                    );
                  }

                  if (item.comingSoon && canAccess) {
                    // Coming soon but admin can access
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          onClose();
                          onNavInteraction?.();
                        }}
                        className="flex items-center gap-3 w-full group"
                      >
                        <div className={getNavIconContainerClasses(isActive, 'lg')}>
                          <Icon size={20} className={getNavIconClasses(isActive)} />
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <span className={`text-sm font-medium transition-colors ${getNavIconClasses(isActive)}`}>{item.label}</span>
                          <Badge variant="primary" className="text-[10px] px-2 py-0.5">Preview</Badge>
                        </div>
                      </Link>
                    );
                  }
                  
                  // Regular items - all are proper links
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        // If clicking Home while already on home page, scroll to top smoothly
                        if (item.href === '/' && pathname === '/') {
                          e.preventDefault();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        onClose();
                        onNavInteraction?.();
                      }}
                      className="flex items-center gap-3 w-full group"
                    >
                      <div className={getNavIconContainerClasses(isActive, 'lg')}>
                        <Icon size={20} className={getNavIconClasses(isActive)} />
                      </div>
                      <span className={`flex-1 text-sm font-medium transition-colors ${getNavIconClasses(isActive)}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-6 space-y-4">
              {/* Logo + Social Icons */}
              <div className="flex items-center justify-center gap-5 pb-4">
                <Logo width={50} height={34} className="w-12 h-8" />
                <Divider variant="vertical" className="h-5" />
                <a
                  href="https://t.me/veganfriendsdao"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Telegram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com/VeganFriendsDAO"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Twitter/X"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaXTwitter size={20} />
                </a>
                <a
                  href="https://github.com/VF-DAO/vfdao-eco-engine"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
              {/* Divider */}
              <Divider />
              
              <div className="flex items-center justify-between">
                <WalletButton />
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Navigation() {
  const { isConnected, accountId } = useWallet();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('/');

  // Check if current user is admin
  const isAdmin = accountId ? ADMIN_ACCOUNTS.includes(accountId) : false;

  // Scroll hide state for mobile
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navInteractionTime, setNavInteractionTime] = useState<number | null>(null);
  const [sidebarInteractionTime, setSidebarInteractionTime] = useState<number | null>(null);

  // Swipe gesture state for mobile sidebar
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Close sidebar when user disconnects
  useEffect(() => {
    if (!isConnected) {
      setIsSidebarOpen(false);
      setIsDesktopExpanded(false);
    }
  }, [isConnected]);

  // Listen for custom event to open sidebar (from HomeFloatingHeader)
  useEffect(() => {
    const handleOpenSidebar = () => {
      setIsSidebarOpen(true);
    };
    window.addEventListener('open-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('open-sidebar', handleOpenSidebar);
  }, []);

  // Update body class for sidebar state
  useEffect(() => {
    if (isConnected) {
      if (isDesktopExpanded) {
        document.body.classList.add('sidebar-expanded');
        document.body.classList.remove('sidebar-collapsed');
      } else {
        document.body.classList.add('sidebar-collapsed');
        document.body.classList.remove('sidebar-expanded');
      }
    }
    return () => {
      document.body.classList.remove('sidebar-expanded', 'sidebar-collapsed');
    };
  }, [isDesktopExpanded, isConnected]);

  // Handle touch events for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Only handle swipes on mobile
    if (window.innerWidth >= 768) return;

    // Open sidebar with right swipe from left edge
    if (isRightSwipe && !isSidebarOpen && touchStart < 50) {
      setIsSidebarOpen(true);
    }
    // Close sidebar with left swipe
    else if (isLeftSwipe && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // Handle scroll to hide/show navigation on mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY;
      const now = Date.now();

      // Only hide/show on mobile
      if (window.innerWidth >= 768) {
        setIsNavVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      // Keep nav visible for 0.5s after bottom nav interaction or 1s after sidebar interaction
      if ((navInteractionTime && (now - navInteractionTime) < 500) || 
          (sidebarInteractionTime && (now - sidebarInteractionTime) < 1000)) {
        setIsNavVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      // Hide navigation when scrolling down, show when scrolling up
      if (scrollDifference > 10) {
        // Scrolling down - hide nav
        setIsNavVisible(false);
      } else if (scrollDifference < -10) {
        // Scrolling up - show nav
        setIsNavVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, navInteractionTime, sidebarInteractionTime]);

  // Clear navigation interaction time after 0.5 seconds
  useEffect(() => {
    if (navInteractionTime) {
      const timeout = setTimeout(() => {
        setNavInteractionTime(null);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [navInteractionTime]);

  // Clear sidebar interaction time after 1 second
  useEffect(() => {
    if (sidebarInteractionTime) {
      const timeout = setTimeout(() => {
        setSidebarInteractionTime(null);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [sidebarInteractionTime]);

  // Track active section based on pathname
  useEffect(() => {
    // Set active section based on current pathname
    if (pathname === '/') {
      setActiveSection('/');
    } else if (pathname.startsWith('/vf')) {
      setActiveSection('/vf');
    } else if (pathname.startsWith('/dao')) {
      setActiveSection('/dao');
    } else if (pathname.startsWith('/products') || pathname.startsWith('/scan') || pathname.startsWith('/studio')) {
      setActiveSection('/explore');
    } else {
      setActiveSection(pathname);
    }
  }, [pathname]);

  // Check if we're on a profile page (has its own navigation)
  const isProfilePage = pathname?.startsWith('/profile');
  // Check if we're on a DAO page (has its own floating header)
  const isDaoPage = pathname?.startsWith('/dao');
  // Check if we're on the homepage (has its own floating header)
  const isHomePage = pathname === '/';
  // Check if we're on the VF token page (has its own floating header)
  const isVfPage = pathname?.startsWith('/vf');
  // Pages with their own floating header should hide mobile nav
  const hasFloatingHeader = isProfilePage || isDaoPage || isHomePage || isVfPage;

  return (
    <>
      {isConnected && (
        <>
          {/* Swipe zone on left edge for opening sidebar on mobile */}
          <div
            className="md:hidden fixed left-0 top-0 bottom-0 w-8 z-20"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />

          {/* Top Bar - Only visible on mobile, hidden on pages with floating headers */}
          {!hasFloatingHeader && (
          <div className={`md:hidden fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border transition-transform duration-300 ${
            isNavVisible ? 'translate-y-0' : '-translate-y-full'
          }`}>
            <div className="flex h-16 items-center justify-between px-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-full transition-all"
                aria-label="Open sidebar"
              >
                <ProfileAvatar
                  accountId={accountId || ''}
                  size="sm"
                  className="w-9 h-9 ring-2 ring-background"
                />
              </button>

              <div className="flex-1 flex justify-center">
                <button
                  onClick={(e) => {
                    if (pathname === '/') {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      window.location.href = '/';
                    }
                  }}
                  className="focus:outline-none border-none outline-none"
                >
                  <Logo width={70} height={48} className="w-18 h-12" />
                </button>
              </div>

              <div className="w-10" /> {/* Spacer for balance */}
            </div>
          </div>
          )}

          {/* Desktop Sidebar */}
          <div className={`hidden md:flex fixed left-0 top-0 h-full bg-background border-r border-border shadow-sidebar z-40 flex-col transition-all duration-300 ${
            isDesktopExpanded ? 'w-72' : 'w-20'
          }`}>
            {/* Header - Profile */}
            <div className={`flex flex-col items-center p-4 transition-all duration-300 ease-in-out ${isDesktopExpanded ? '' : 'space-y-3'}`}>
              {isDesktopExpanded ? (
                <div className="flex items-center justify-between w-full transition-all duration-300">
                  <Link href="/profile" className="flex items-center gap-3 group">
                    <ProfileAvatar
                      accountId={accountId || ''}
                      size="md"
                      className="w-10 h-10 ring-2 ring-background"
                    />
                    <span className="font-semibold text-sm truncate max-w-[140px] group-hover:text-primary transition-colors">
                      {accountId?.replace('.near', '') || 'Profile'}
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsDesktopExpanded(false)}
                    className="p-2 rounded-md transition-colors group"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Link href="/profile" className="group">
                    <ProfileAvatar
                      accountId={accountId || ''}
                      size="md"
                      className="w-10 h-10 ring-2 ring-background"
                    />
                  </Link>
                  <button
                    onClick={() => setIsDesktopExpanded(true)}
                    className="p-1 rounded-md transition-colors group"
                    aria-label="Expand sidebar"
                  >
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              )}
            </div>
            {/* Divider */}
            <div className={isDesktopExpanded ? 'px-4' : 'px-3'}>
              <Divider />
            </div>

            {/* Navigation Items */}
            <div className="flex-1 py-6">
              <nav className="px-4 space-y-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.href;
                  const canAccess = !item.comingSoon || (item.adminOnly && isAdmin);
                  
                  if (item.comingSoon && !canAccess) {
                    // Coming soon - not clickable for non-admins
                    return (
                      <div
                        key={item.label}
                        className="flex items-center w-full opacity-60 cursor-not-allowed"
                      >
                        <div className={`flex-shrink-0 ${iconContainerVariants({ variant: 'inactiveStatic', size: 'lg' })}`}>
                          <Icon size={18} className={inactiveIconClasses} />
                        </div>
                        <div 
                          className={`flex items-center gap-2 ml-3 overflow-hidden transition-all duration-300 ease-in-out ${
                            isDesktopExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                          }`}
                        >
                          <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">{item.label}</span>
                          <Badge variant="muted" className="text-[10px] px-2 py-0.5">Soon</Badge>
                        </div>
                      </div>
                    );
                  }

                  if (item.comingSoon && canAccess) {
                    // Coming soon but admin can access
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center w-full group"
                      >
                        <div className={`flex-shrink-0 ${getNavIconContainerClasses(isActive, 'lg')}`}>
                          <Icon size={18} className={getNavIconClasses(isActive)} />
                        </div>
                        <div 
                          className={`flex items-center gap-2 ml-3 overflow-hidden transition-all duration-300 ease-in-out ${
                            isDesktopExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                          }`}
                        >
                          <span className={`text-sm font-medium whitespace-nowrap transition-colors ${getNavIconClasses(isActive)}`}>{item.label}</span>
                          <Badge variant="primary" className="text-[10px] px-2 py-0.5">Preview</Badge>
                        </div>
                      </Link>
                    );
                  }
                  
                  // Regular items - all are proper links
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        // If clicking Home while already on home page, scroll to top smoothly
                        if (item.href === '/' && pathname === '/') {
                          e.preventDefault();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="flex items-center w-full group"
                    >
                      <div className={`flex-shrink-0 ${getNavIconContainerClasses(isActive, 'lg')}`}>
                        <Icon size={18} className={getNavIconClasses(isActive)} />
                      </div>
                      <span 
                        className={`ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                          isDesktopExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                        } ${getNavIconClasses(isActive)}`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className={`p-4 transition-all duration-300 ease-in-out ${isDesktopExpanded ? 'space-y-4' : 'flex flex-col items-center space-y-3'}`}>
              {isDesktopExpanded ? (
                <>
                  {/* Logo + Social Icons */}
                  <div className="flex items-center justify-center gap-5 pb-4 transition-all duration-300">
                    <Logo width={50} height={34} className="w-12 h-8" />
                    <Divider variant="vertical" className="h-5" />
                    <a
                      href="https://t.me/veganfriendsdao"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Telegram"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Send className="w-5 h-5" />
                    </a>
                    <a
                      href="https://x.com/VeganFriendsDAO"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Twitter/X"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaXTwitter size={20} />
                    </a>
                    <a
                      href="https://github.com/VF-DAO/vfdao-eco-engine"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="GitHub"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  </div>
                  {/* Divider */}
                  <Divider />
                  
                  <div className="flex items-center justify-between transition-all duration-300">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.15 }}
                      className="transition-all duration-300 ease-in-out"
                    >
                      <WalletButton />
                    </motion.div>
                    <ThemeToggle />
                  </div>
                </>
              ) : (
                <>
                  {/* Logo (collapsed) */}
                  <div className="pb-1">
                    <Logo width={40} height={27} className="w-10 h-7" />
                  </div>
                  <div className="w-full flex justify-center px-2 transition-all duration-300">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="transition-all duration-300 ease-in-out"
                    >
                      <WalletButton compact className="w-full max-w-[60px]" />
                    </motion.div>
                  </div>
                  <div className="transition-all duration-300">
                    <ThemeToggle />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            activeSection={activeSection}
            pathname={pathname}
            onNavInteraction={() => setSidebarInteractionTime(Date.now())}
            isAdmin={isAdmin}
            accountId={accountId}
          />

          {/* Mobile Bottom Navigation */}
          <div className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border transition-transform duration-300 ${
            isNavVisible ? 'translate-y-0' : 'translate-y-full'
          }`}>
            <div className="flex items-center justify-center h-16">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.href;
                const canAccess = !item.comingSoon || (item.adminOnly && isAdmin);

                if (item.comingSoon && !canAccess) {
                  // Coming soon - not clickable for non-admins
                  return (
                    <div
                      key={item.label}
                      className="flex flex-col items-center justify-center flex-1 py-2 px-1 relative group opacity-60 cursor-not-allowed"
                    >
                      <div className={iconContainerVariants({ variant: 'inactiveStatic', size: 'md' })}>
                        <Icon size={20} className={inactiveIconClasses} />
                      </div>
                      <Badge variant="muted" className="absolute -top-0.5 right-1 text-[8px] px-1.5 py-0">Soon</Badge>
                    </div>
                  );
                }

                if (item.comingSoon && canAccess) {
                  // Coming soon but admin can access
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setNavInteractionTime(Date.now())}
                      className="flex flex-col items-center justify-center flex-1 py-2 px-1 relative group"
                      aria-label={item.label}
                    >
                      <div className={getNavIconContainerClasses(isActive, 'md')}>
                        <Icon size={20} className={getNavIconClasses(isActive)} />
                      </div>
                      <Badge variant="primary" className="absolute -top-0.5 right-1 text-[8px] px-1.5 py-0">Preview</Badge>
                    </Link>
                  );
                }
                
                // Regular items - all are proper links
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      // If clicking Home while already on home page, scroll to top smoothly
                      if (item.href === '/' && pathname === '/') {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                      setNavInteractionTime(Date.now());
                    }}
                    className="flex flex-col items-center justify-center flex-1 py-2 px-1 group"
                    aria-label={item.label}
                  >
                    <div className={getNavIconContainerClasses(isActive, 'md')}>
                      <Icon size={20} className={getNavIconClasses(isActive)} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
