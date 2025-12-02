'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Users, Globe, Map, MessageCircle, Menu, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import Logo from '@/components/logo';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '#', icon: Home },
  { label: 'Who This Is For', href: '#learn-more', icon: Users },
  { label: 'Real-world scenarios', href: '#use-cases', icon: Globe },
  { label: 'The Journey Ahead', href: '#timeline', icon: Map },
  { label: "Let's Connect", href: '#community', icon: MessageCircle },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('#');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // If we're at the very top, show home as active
      if (scrollTop < windowHeight * 0.3) {
        if (activeSection !== '#') {
          setActiveSection('#');
        }
        return;
      }
      
      // Find the section closest to the top of the viewport
      const sections = ['#learn-more', '#use-cases', '#timeline', '#community'];
      let closestSection = '#';
      let closestDistance = Infinity;
      
      for (const sectionId of sections) {
        const element = document.querySelector(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Calculate distance from top of viewport to top of section
          const distance = Math.abs(rect.top);
          
          // Only consider sections that are above or at the top of viewport
          if (rect.top <= 100 && distance < closestDistance) {
            closestDistance = distance;
            closestSection = sectionId;
          }
        }
      }
      
      if (closestSection !== activeSection) {
        setActiveSection(closestSection);
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen for initial load and any DOM changes
    const handleLoad = () => handleScroll();
    window.addEventListener('load', handleLoad);
    
    // Check immediately and after delays to ensure DOM is ready
    handleScroll();
    setTimeout(handleScroll, 100);
    setTimeout(handleScroll, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('load', handleLoad);
    };
  }, [activeSection]);

  const scrollToTop = () => {
    // Ensure we scroll on the window/document
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    // Fallback for documentElement
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    if (href === '#') {
      setActiveSection('#');
      // Delay scroll to allow menu close animation to complete
      setTimeout(() => {
        scrollToTop();
      }, 100);
      return;
    }

    if (href.startsWith('#')) {
      // Immediately set the active section
      setActiveSection(href);
      
      // Use setTimeout to ensure DOM is ready and menu is closed first
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Trigger scroll handler after smooth scroll completes (approximately 300ms)
          setTimeout(() => {
            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            
            // If we're at the very top, show home as active
            if (scrollTop < windowHeight * 0.3) {
              setActiveSection('#');
              return;
            }
            
            // Find the section closest to the top of the viewport
            const sections = ['#learn-more', '#use-cases', '#timeline', '#community'];
            let closestSection = '#';
            let closestDistance = Infinity;
            
            for (const sectionId of sections) {
              const element = document.querySelector(sectionId);
              if (element) {
                const rect = element.getBoundingClientRect();
                // Calculate distance from top of viewport to top of section
                const distance = Math.abs(rect.top);
                
                // Only consider sections that are above or at the top of viewport
                if (rect.top <= 100 && distance < closestDistance) {
                  closestDistance = distance;
                  closestSection = sectionId;
                }
              }
            }
            
            setActiveSection(closestSection);
          }, 300);
        }
      }, 0);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-sm shadow-sm dark:shadow-white/5">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              setActiveSection('#');
              setTimeout(() => {
                scrollToTop();
              }, 0);
            }}
            className="flex items-center cursor-pointer md:hover:opacity-80 md:transition-opacity"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <Logo width={80} height={54} className="w-20 h-14" />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.href;
              
              if (item.href === '#') {
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveSection('#');
                      scrollToTop();
                    }}
                    className="flex items-center justify-center group"
                  >
                    <div className={`w-12 h-12 rounded-full border ${isActive ? 'border-verified bg-verified/10 scale-110' : 'border-border bg-card group-hover:border-muted-foreground/50'} flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${isActive ? 'shadow-md shadow-verified/20' : ''}`}>
                      <Icon size={20} className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
                    </div>
                  </button>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleSmoothScroll(e, item.href)}
                  className="flex items-center justify-center group"
                >
                  <div className={`w-12 h-12 rounded-full border ${isActive ? 'border-verified bg-verified/10 scale-110' : 'border-border bg-card group-hover:border-muted-foreground/50'} flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${isActive ? 'shadow-md shadow-verified/20' : ''}`}>
                    <Icon size={20} className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 flex-shrink-0"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t"
            >
              <div className="py-4 space-y-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.href;
                  
                  if (item.href === '#') {
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          setIsOpen(false);
                          handleSmoothScroll(e, item.href);
                        }}
                        className="flex items-center gap-3 w-full group"
                      >
                        <div className={`w-12 h-12 rounded-full border ${isActive ? 'border-verified bg-verified/10 scale-110' : 'border-border bg-card group-hover:border-muted-foreground/50'} flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${isActive ? 'shadow-md shadow-verified/20' : ''}`}>
                          <Icon size={20} className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
                        </div>
                        <span className={`flex-1 text-sm font-medium text-left transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>{item.label}</span>
                      </Link>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        setIsOpen(false);
                        handleSmoothScroll(e, item.href);
                      }}
                      className="flex items-center gap-3 w-full group"
                    >
                      <div className={`w-12 h-12 rounded-full border ${isActive ? 'border-verified bg-verified/10 scale-110' : 'border-border bg-card group-hover:border-muted-foreground/50'} flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${isActive ? 'shadow-md shadow-verified/20' : ''}`}>
                        <Icon size={20} className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
                      </div>
                      <span className={`flex-1 text-sm font-medium text-left transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>{item.label}</span>
                    </Link>
                  );
                })}
                <div className="px-4 pt-2 border-t flex items-center justify-end">
                  <ThemeToggle />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
