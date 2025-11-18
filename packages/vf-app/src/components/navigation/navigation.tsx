'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightLeft, ChevronLeft, ChevronRight, Droplets, Github, Home, Menu, Send, Vote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { ThemeToggle } from '@/components/theme-toggle';
import { WalletButton } from '@/features/wallet';
import { useWallet } from '@/features/wallet';
import Logo from '@/components/ui/logo';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '#', icon: Home },
  { label: 'Swap', href: '#tokens', icon: ArrowRightLeft },
  { label: 'Liquidity', href: '#liquidity', icon: Droplets },
  { label: 'DAO', href: '#dao', icon: Vote, comingSoon: true, disabled: true }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onNavInteraction?: () => void;
}

function Sidebar({ isOpen, onClose, activeSection, onNavInteraction }: SidebarProps) {
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
                  const Icon = item.icon;
                  const isActive = activeSection === item.href;
                  
                  if (item.comingSoon) {
                    return (
                      <div
                        key={item.label}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-full opacity-60"
                      >
                        <Icon size={18} />
                        <span className="flex-1">{item.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Soon</span>
                      </div>
                    );
                  }
                  
                  if (item.href === '#') {
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          onClose();
                          onNavInteraction?.();
                          setTimeout(() => scrollToTop(), 300);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-full transition-colors ${
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
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault();
                        onClose();
                        onNavInteraction?.();
                        setTimeout(() => {
                          const element = document.querySelector(item.href);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 300);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-full transition-colors ${
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
            <div className="p-6 space-y-4">
              {/* Social Icons */}
              <div className="flex justify-center gap-4 text-muted-foreground pb-4 border-b border-border">
                <a
                  href="https://t.me/veganfriendsdao"
                  className="hover:text-primary transition-colors"
                  aria-label="Telegram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com/VeganFriendsDAO"
                  className="hover:text-primary transition-colors"
                  aria-label="Twitter/X"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaXTwitter size={20} />
                </a>
                <a
                  href="https://github.com/VF-DAO/vfdao-eco-engine"
                  className="hover:text-primary transition-colors"
                  aria-label="GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
              
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
  const { isConnected } = useWallet();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('#');

  // Scroll hide state for mobile
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navInteractionTime, setNavInteractionTime] = useState<number | null>(null);
  const [sidebarInteractionTime, setSidebarInteractionTime] = useState<number | null>(null);

  // Swipe gesture state for mobile sidebar
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Reset sidebar state when wallet connection changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsDesktopExpanded(false);
  }, [isConnected]);

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

  // Track active section based on scroll position
  useEffect(() => {
    const sectionIds = ['#tokens', '#liquidity'];
    
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      let currentActiveSection = '#';
      
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id ? `#${entry.target.id}` : '#';
          // Prioritize sections in order: tokens, then liquidity
          if (sectionId === '#tokens') {
            currentActiveSection = '#tokens';
          } else if (sectionId === '#liquidity' && currentActiveSection !== '#tokens') {
            currentActiveSection = '#liquidity';
          }
        }
      });
      
      setActiveSection(currentActiveSection);
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    sectionIds.forEach((sectionId) => {
      const element = document.querySelector(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    // Handle home section when at top of page
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // If we're at the very top, show home as active
      if (scrollTop < windowHeight * 0.3) {
        setActiveSection('#');
        return;
      }
      
      // Check if any section is in view
      const tokensSection = document.querySelector('#tokens');
      const liquiditySection = document.querySelector('#liquidity');
      
      if (tokensSection) {
        const tokensRect = tokensSection.getBoundingClientRect();
        if (tokensRect.top <= windowHeight * 0.5 && tokensRect.bottom >= windowHeight * 0.5) {
          setActiveSection('#tokens');
          return;
        }
      }
      
      if (liquiditySection) {
        const liquidityRect = liquiditySection.getBoundingClientRect();
        if (liquidityRect.top <= windowHeight * 0.5 && liquidityRect.bottom >= windowHeight * 0.5) {
          setActiveSection('#liquidity');
          return;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
            <div className={`flex flex-col items-center p-4 border-b border-border transition-all duration-300 ease-in-out ${isDesktopExpanded ? '' : 'space-y-3'}`}>
              {isDesktopExpanded ? (
                <div className="flex items-center justify-between w-full transition-all duration-300">
                  <div className="transition-all duration-300 ease-in-out">
                    <Logo width={80} height={54} className="w-20 h-14" />
                  </div>
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
                  <div className="transition-all duration-300 ease-in-out">
                    <Logo width={64} height={43} className="w-16 h-11" />
                  </div>
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>

            {/* Navigation Items */}
            <div className="flex-1 py-6 transition-all duration-300">
              <nav className="px-2 space-y-2 transition-all duration-300">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.href;
                  
                  if (item.comingSoon) {
                    return (
                      <div
                        key={item.label}
                        className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-full opacity-60 transition-all duration-300 ease-in-out ${
                          isDesktopExpanded ? '' : 'justify-center'
                        }`}
                      >
                        <div className="transition-all duration-300">
                          <Icon size={18} />
                        </div>
                        {isDesktopExpanded && (
                          <div className="flex-1 transition-all duration-300 ease-in-out">
                            <span>{item.label}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground ml-2">Soon</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (item.disabled) {
                    return (
                      <div
                        key={item.label}
                        className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-full opacity-50 transition-all duration-300 ease-in-out ${
                          isDesktopExpanded ? '' : 'justify-center'
                        }`}
                      >
                        <div className="transition-all duration-300">
                          <Icon size={18} />
                        </div>
                        {isDesktopExpanded && (
                          <span className="flex-1 transition-all duration-300 ease-in-out">{item.label}</span>
                        )}
                      </div>
                    );
                  }
                  
                  if (item.href === '#') {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-full transition-all duration-300 ease-in-out ${
                          isDesktopExpanded ? '' : 'justify-center'
                        } ${
                          isActive
                            ? 'bg-accent/10'
                            : 'hover:bg-accent/10'
                        }`}
                      >
                        <div className="transition-all duration-300">
                          <Icon size={18} />
                        </div>
                        {isDesktopExpanded && (
                          <span className="flex-1 transition-all duration-300 ease-in-out">{item.label}</span>
                        )}
                      </Link>
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
                      className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-full transition-all duration-300 ease-in-out ${
                        isDesktopExpanded ? '' : 'justify-center'
                      } ${
                        isActive
                          ? 'bg-accent/10'
                          : 'hover:bg-accent/10'
                      }`}
                    >
                      <div className="transition-all duration-300">
                        <Icon size={18} />
                      </div>
                      {isDesktopExpanded && (
                        <span className="flex-1 transition-all duration-300 ease-in-out">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className={`p-4 transition-all duration-300 ease-in-out ${isDesktopExpanded ? 'space-y-4' : 'flex flex-col items-center space-y-3'}`}>
              {isDesktopExpanded ? (
                <>
                  {/* Social Icons */}
                  <div className="flex justify-center gap-4 text-muted-foreground pb-4 border-b border-border transition-all duration-300">
                    <a
                      href="https://t.me/veganfriendsdao"
                      className="hover:text-primary transition-colors"
                      aria-label="Telegram"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Send className="w-5 h-5" />
                    </a>
                    <a
                      href="https://x.com/VeganFriendsDAO"
                      className="hover:text-primary transition-colors"
                      aria-label="Twitter/X"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaXTwitter size={20} />
                    </a>
                    <a
                      href="https://github.com/VF-DAO/vfdao-eco-engine"
                      className="hover:text-primary transition-colors"
                      aria-label="GitHub"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  </div>
                  
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
            onNavInteraction={() => setSidebarInteractionTime(Date.now())}
          />

          {/* Mobile Bottom Navigation */}
          <div className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border transition-transform duration-300 ${
            isNavVisible ? 'translate-y-0' : 'translate-y-full'
          }`}>
            <div className="flex items-center justify-center h-16">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.href;
                
                if (item.disabled) {
                  return (
                    <div
                      key={item.label}
                      className="flex flex-col items-center justify-center flex-1 py-2 px-1 group opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center">
                        <Icon size={18} className="text-muted-foreground" />
                      </div>
                    </div>
                  );
                }

                if (item.comingSoon) {
                  return (
                    <div
                      key={item.label}
                      className="flex flex-col items-center justify-center flex-1 py-2 px-1 relative group"
                    >
                      <div className={`w-10 h-10 rounded-full border ${isActive ? 'border-verified bg-verified/10 scale-110' : 'border-border bg-card hover:border-primary/50'} flex items-center justify-center transition-all duration-200 ${isActive ? 'shadow-lg shadow-verified/20' : ''}`}>
                        <Icon size={18} className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
                      </div>
                      <span className="absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Soon</span>
                    </div>
                  );
                }
                
                if (item.href === '#') {
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        setNavInteractionTime(Date.now());
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex flex-col items-center justify-center flex-1 py-2 px-1 group"
                      aria-label={item.label}
                    >
                      <div className={`w-10 h-10 rounded-full border ${isActive ? 'border-verified bg-verified/10 scale-110' : 'border-border bg-card hover:border-primary/50'} flex items-center justify-center transition-all duration-200 ${isActive ? 'shadow-lg shadow-verified/20' : ''}`}>
                        <Icon size={18} className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
                      </div>
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      setNavInteractionTime(Date.now());
                      const element = document.querySelector(item.href);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="flex flex-col items-center justify-center flex-1 py-2 px-1 group"
                    aria-label={item.label}
                  >
                    <div className={`w-10 h-10 rounded-full border ${isActive ? 'border-verified bg-verified/10 scale-110' : 'border-border bg-card hover:border-primary/50'} flex items-center justify-center transition-all duration-200 ${isActive ? 'shadow-lg shadow-verified/20' : ''}`}>
                      <Icon size={18} className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
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
