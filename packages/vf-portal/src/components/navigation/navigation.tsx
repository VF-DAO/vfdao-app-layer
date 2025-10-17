'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { WalletButton } from '@/components/wallet-button'
import Logo from '@/components/logo'

const navItems = [
  { label: 'Home', href: '#' },
  { label: 'Who This Is For', href: '#learn-more' },
  { label: 'Real-world scenarios', href: '#use-cases' },
  { label: 'The Journey Ahead', href: '#timeline' },
  { label: 'Community', href: '#community' },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const scrollToTop = () => {
    // Ensure we scroll on the window/document
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
    // Fallback for documentElement
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    
    if (href === '#') {
      scrollToTop()
      return
    }
    
    if (href.startsWith('#')) {
      // Use setTimeout to ensure DOM is ready and menu is closed first
      setTimeout(() => {
        const element = document.querySelector(href)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 0)
    }
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-sm shadow-sm dark:shadow-white/5"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
              setTimeout(() => {
                scrollToTop()
              }, 0)
            }} 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Logo width={96} height={60} className="w-24 h-15" />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              if (item.href === '#') {
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      scrollToTop()
                    }}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </button>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleSmoothScroll(e, item.href)}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <div className="hidden md:block">
              <WalletButton />
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2"
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
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t"
            >
              <div className="py-4 space-y-4">
                {navItems.map((item) => {
                  if (item.href === '#') {
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          setIsOpen(false)
                          // Delay scroll to allow menu close animation to complete
                          setTimeout(() => {
                            scrollToTop()
                          }, 100)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent/10 rounded-md transition-colors"
                      >
                        {item.label}
                      </button>
                    )
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        setIsOpen(false)
                        handleSmoothScroll(e, item.href)
                      }}
                      className="block px-4 py-2 text-sm font-medium hover:bg-accent/10 rounded-md transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                })}
                <div className="px-4 pt-2 border-t flex items-center justify-between">
                  <WalletButton />
                  <ThemeToggle />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
