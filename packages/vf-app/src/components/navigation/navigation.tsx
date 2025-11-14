'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightLeft, ChevronLeft, ChevronRight, Droplets, Home, Menu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { WalletButton } from '@/components/wallet-button';
import Logo from '@/components/ui/logo';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  { label: 'Home', href: '#', icon: Home },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  { label: 'Swap', href: '#tokens', icon: ArrowRightLeft },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  { label: 'Liquidity', href: '#liquidity', icon: Droplets }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
}

function Sidebar({ isOpen, onClose, activeSection }: SidebarProps) {
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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    onClose(); // Close sidebar first

    if (href === '#') {
      setTimeout(() => scrollToTop(), 300); // Delay to allow sidebar close animation
      return;
    }

    if (href.startsWith('#')) {
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
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
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-80 max-w-[90vw] bg-background border-r border-border shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <Logo width={80} height={54} className="w-20 h-14" />
              <button
                onClick={onClose}
                className="p-2 rounded-md transition-colors group"
                aria-label="Close sidebar"
              >
                <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-1" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 py-6">
              <nav className="px-4 space-y-2">
                {navItems.map((item) => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  const Icon = item.icon;
                  const isActive = activeSection === item.href;
                  if (item.href === '#') {
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          onClose();
                          setTimeout(() => scrollToTop(), 300);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-accent/10'
                            : 'hover:bg-accent/10'
                        }`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleSmoothScroll(e, item.href)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-accent/10'
                          : 'hover:bg-accent/10'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border space-y-4">
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('#');

  // Scroll hide state for mobile
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Swipe gesture state for mobile sidebar
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

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

      // Only hide/show on mobile
      if (window.innerWidth >= 768) {
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
  }, [lastScrollY]);

  // Track active section based on scroll position
  useEffect(() => {
    const sections = navItems.map(item => item.href).filter(href => href !== '#');
    sections.push('#'); // Add home section
    sections.push('#liquidity'); // Add liquidity section

    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id ? `#${entry.target.id}` : '#';
          setActiveSection(sectionId);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    sections.forEach((section) => {
      if (section === '#') {
        // For home, observe the top of the page
        observer.observe(document.body);
      } else {
        const element = document.querySelector(section);
        if (element) {
          observer.observe(element);
        }
      }
    });

    // Also listen for scroll to handle home section
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      if (scrollTop < 100) {
        setActiveSection('#');
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* Swipe zone on left edge for opening sidebar on mobile */}
      <div
        className="md:hidden fixed left-0 top-0 bottom-0 w-8 z-20"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* Top Bar - Only visible on mobile */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 flex justify-center">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="focus:outline-none border-none outline-none"
            >
              <Logo width={70} height={48} className="w-18 h-12" />
            </button>
          </div>

          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden md:flex fixed left-0 top-0 h-full bg-background border-r border-border shadow-lg z-40 flex-col transition-all duration-300 ${
        isDesktopExpanded ? 'w-72' : 'w-20'
      }`}>
        {/* Header */}
        <div className={`flex flex-col items-center p-4 border-b border-border ${isDesktopExpanded ? '' : 'space-y-3'}`}>
          {isDesktopExpanded ? (
            <div className="flex items-center justify-between w-full">
              <Logo width={80} height={54} className="w-20 h-14" />
              <button
                onClick={() => setIsDesktopExpanded(false)}
                className="p-2 rounded-md transition-colors group"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsDesktopExpanded(true)}
              className="flex flex-col items-center space-y-2 p-2 rounded-md transition-colors group"
              aria-label="Expand sidebar"
            >
              <Logo width={64} height={43} className="w-16 h-11" />
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6">
          <nav className="px-2 space-y-2">
            {navItems.map((item) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const Icon = item.icon;
              const isActive = activeSection === item.href;
              if (item.href === '#') {
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isDesktopExpanded ? '' : 'justify-center'
                    } ${
                      isActive
                        ? 'bg-accent/10'
                        : 'hover:bg-accent/10'
                    }`}
                    title={isDesktopExpanded ? '' : item.label}
                  >
                    <Icon size={18} />
                    {isDesktopExpanded && <span>{item.label}</span>}
                  </button>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    const element = document.querySelector(item.href);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isDesktopExpanded ? '' : 'justify-center'
                  } ${
                    isActive
                      ? 'bg-accent/10'
                      : 'hover:bg-accent/10'
                  }`}
                  title={isDesktopExpanded ? '' : item.label}
                >
                  <Icon size={18} />
                  {isDesktopExpanded && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t border-border ${isDesktopExpanded ? 'space-y-4' : 'flex flex-col items-center space-y-3'}`}>
          {isDesktopExpanded ? (
            <>
              <div className="flex items-center justify-between">
                <WalletButton />
                <ThemeToggle />
              </div>
            </>
          ) : (
            <>
              <div className="w-full flex justify-center px-2">
                <WalletButton compact className="w-full max-w-[60px]" />
              </div>
              <ThemeToggle />
            </>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} activeSection={activeSection} />

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex items-center justify-center h-16">
          {navItems.map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const Icon = item.icon;
            const isActive = activeSection === item.href;
            if (item.href === '#') {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={20} className="mb-1" />
                  {item.label}
                </button>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  const element = document.querySelector(item.href);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={20} className="mb-1" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
