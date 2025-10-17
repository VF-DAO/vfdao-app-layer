'use client'

import { ArrowRight, Heart, Leaf, Users, Clock, Shield, Scan, CheckCircle2, Zap, Network } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { VerificationFlow } from '@/components/verification-flow'
import { UseCaseCarousel } from '@/components/use-case-carousel'

export default function Home() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const glowColor = isDark ? 'rgba(246,198,56,0.6)' : 'rgba(157,196,145,0.6)'
  const glowStyle = `drop-shadow-[0_0_12px_${glowColor}]`

  return (
    <div className="flex flex-col">
      {/* Hero Section - Mission-Driven */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
        {/* Subtle Dot Grid Background - Represents verification checkpoints */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.08)_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1.5px,transparent_1.5px)] bg-[size:40px_40px]" />

        <div className="text-center space-y-6 sm:space-y-8 md:space-y-12 max-w-5xl relative z-10 pt-16 sm:pt-20 pb-8 sm:pb-12">
          {/* Main Headline */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tighter sm:tracking-tight leading-tight">
              Don't trust.
              <br />
              It's already <span className="text-verified">verified.</span>
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Scan any product. See its complete journey from farm to shelf. 
              <span className="text-foreground font-medium"> Every ingredient verified animal-free.</span>
            </p>
          </div>

          {/* Simple Explanation */}
          <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 sm:px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs sm:text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Blockchain-powered supply chain transparency</span>
            </span>
            <span className="whitespace-nowrap">• Launching Q1 2026</span>
          </div>
          
          {/* Verification Flow Animation */}
          <div>
            <VerificationFlow />
          </div>

          {/* CTAs */}
          <div className="flex flex-row gap-2 justify-center w-full flex-wrap">
            <Link 
              href="#learn-more" 
              className="inline-flex items-center justify-center gap-2 border border-primary bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full font-semibold transition-all hover:shadow-md hover:shadow-primary/10 group text-xs sm:text-sm md:text-base whitespace-nowrap"
            >
              Learn More
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </Link>
            
            <Link
              href="#community"
              className="inline-flex items-center justify-center gap-2 border border-verified hover:border-verified/80 text-primary hover:text-primary px-3 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full font-semibold transition-all hover:shadow-md hover:shadow-verified/10 group text-xs sm:text-sm md:text-base whitespace-nowrap"
            >
              Join the Movement
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section id="learn-more" className="py-16 sm:py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground inline-flex items-center justify-center gap-3">
              <Users className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary ${isDark ? 'drop-shadow-[0_0_20px_rgba(246,198,56,0.8)]' : 'drop-shadow-[0_0_20px_rgba(157,196,145,0.8)]'}`} />
              Who This Is For
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you consume, produce, or certify — we're building this together
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Consumer Card */}
            <StakeholderCard
              icon={<Scan className="w-6 h-6 sm:w-8 sm:h-8" />}
              title="If You're a Consumer Who Cares"
              description="You spend extra for ethical products. You read labels. You try to make responsible choices."
              pain="But you've wondered: 'Is this really vegan, or just marketing?'"
              solution="Scan any product → see complete supply chain in no time. No more guessing. Just proof."
              cta="Get Early Access"
              ctaHref="#waitlist"
            />

            {/* Producer Card */}
            <StakeholderCard
              icon={<Leaf className="w-6 h-6 sm:w-8 sm:h-8" />}
              title="If You're a Committed Producer"
              description="You grow or manufacture vegan products with integrity and care."
              pain="But proving your practices takes time and resources you don't have."
              solution="Prove your practices instantly with blockchain records. Turn your ethics into competitive advantage."
              cta="Become a Partner"
              ctaHref="#partners"
            />

            {/* Brand Card */}
            <StakeholderCard
              icon={<Shield className="w-6 h-6 sm:w-8 sm:h-8" />}
              title="If You're Building an Ethical Brand"
              description="You're committed to transparency. You want to prove your values, not just claim them."
              pain="But consumers find it hard to trust marketing claims without proof."
              solution="Showcase complete farm-to-shelf transparency. Build trust through proof, not promises."
              cta="Learn More"
              ctaHref="#brands"
            />

            {/* Community Card */}
            <StakeholderCard
              icon={<Users className="w-6 h-6 sm:w-8 sm:h-8" />}
              title="If You Want Real Transparency"
              description="You care about ethical products and want to make a real impact."
              pain="Individual choices can feel insignificant in an opaque system."
              solution="Join our community to verify products and build transparency together."
              cta="Join Community"
              ctaHref="#community"
            />
          </div>
        </div>
      </section>

      {/* Use Cases - Real World Impact */}
      <section id="use-cases" className="py-16 sm:py-24 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground inline-flex items-center justify-center gap-3">
              <Zap className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary ${isDark ? 'drop-shadow-[0_0_20px_rgba(246,198,56,0.8)]' : 'drop-shadow-[0_0_20px_rgba(157,196,145,0.8)]'}`} />
              Real-world scenarios
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              From coffee shops to farms, from retailers to certifiers—see how VeganFriends transforms daily decisions into verified truth.
            </p>
          </div>

          <UseCaseCarousel />
        </div>
      </section>

      {/* Timeline - The Journey Ahead */}
      <section id="timeline" className="py-16 sm:py-24 px-4 border-t border-border bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground inline-flex items-center justify-center gap-3">
              <Clock className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary ${isDark ? 'drop-shadow-[0_0_20px_rgba(246,198,56,0.8)]' : 'drop-shadow-[0_0_20px_rgba(157,196,145,0.8)]'}`} />
              The Journey Ahead
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Join us from the beginning.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <TimelineItem
              quarter="Q4 2025"
              status="current"
              title="Foundation & Design"
              items={[
                "$VF token launched with initial liquidity ✅",
                "OnSocial Protocol contracts in testing",
                "8-layer verification system architected",
                "Community building & partnership discussions"
              ]}
            />
            
            <TimelineItem
              quarter="Q1 2026"
              status="upcoming"
              title="Smart Contracts Go Live"
              items={[
                "OnSocial Protocol mainnet deployment",
                "Core supply chain tracking contracts live",
                "Security audits completed"
              ]}
            />
            
            <TimelineItem
              quarter="Q2 2026"
              status="upcoming"
              title="Infrastructure Build"
              items={[
                "Stakeholder portals development",
                "Consumer app (mobile + web)",
                "Substreams indexer deployment"
              ]}
            />
            
            <TimelineItem
              quarter="Q3 2026"
              status="upcoming"
              title="Initial Onboarding"
              items={[
                "First certification bodies onboarded",
                "Pilot producers begin tracking",
                "Beta testing with early adopters"
              ]}
            />
            
            <TimelineItem
              quarter="Q4 2026"
              status="upcoming"
              title="Public Launch"
              items={[
                "Consumer app launches",
                "First products fully tracked farm-to-shelf",
                "Public marketplace opens"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Community - Build Transparency Together */}
      <section id="community" className="py-16 sm:py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground inline-flex items-center justify-center gap-3">
              <Leaf className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary ${isDark ? 'drop-shadow-[0_0_20px_rgba(246,198,56,0.8)]' : 'drop-shadow-[0_0_20px_rgba(157,196,145,0.8)]'}`} />
              Build Transparency Together
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Every verified product, every badge earned, every story shared—it all matters. Join a community of builders, believers, and vegans making truth the standard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 pt-8">
            <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">Early Adopter</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Be first to try the platform when we launch
              </p>
              <Link href="https://t.me/veganfriendsdao" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary font-semibold hover:gap-3 transition-all">
                Get Early Access
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-verified flex-shrink-0" />
              </Link>
            </div>
            
            <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">Community Member</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Connect with other vegans building transparency
              </p>
              <Link href="https://t.me/veganfriendsdao" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary font-semibold hover:gap-3 transition-all">
                Join Telegram
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-verified flex-shrink-0" />
              </Link>
            </div>
            
            <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">Partner</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Bring your brand or certification body onboard
              </p>
              <Link href="#partners" className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary font-semibold hover:gap-3 transition-all">
                Get in Touch
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-verified flex-shrink-0" />
              </Link>
            </div>
          </div>

          <div className="pt-8 sm:pt-12 space-y-4 sm:space-y-6">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              Don't trust. It's already <span className="text-verified">verified.</span>
            </p>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Every person who joins makes this system stronger. Every product verified makes ethical claims more trustworthy.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

// Stakeholder Card Component
function StakeholderCard({ 
  icon, 
  title, 
  description, 
  pain, 
  solution, 
  cta, 
  ctaHref 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  pain: string
  solution: string
  cta: string
  ctaHref: string
}) {
  return (
    <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg group flex flex-col h-full">
      <div className="space-y-3 sm:space-y-4 flex-1">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-verified bg-verified/10 text-primary shadow-md shadow-verified/20 mb-2 sm:mb-4">
          {icon}
        </div>
        
        {/* Title */}
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{title}</h3>
        
        {/* Description */}
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">{description}</p>
        
        {/* Pain Point */}
        <p className="text-xs sm:text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3 sm:pl-4">
          {pain}
        </p>
        
        {/* Solution */}
        <p className="text-xs sm:text-sm md:text-base text-foreground font-medium">{solution}</p>
      </div>
      
      {/* CTA */}
      <div className="mt-4 sm:mt-6">
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary font-semibold hover:gap-3 transition-all group"
        >
          {cta}
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-verified flex-shrink-0" />
        </Link>
      </div>
    </div>
  )
}

// Timeline Item Component
function TimelineItem({ 
  quarter, 
  status, 
  title, 
  items 
}: { 
  quarter: string
  status: 'current' | 'upcoming' | 'completed'
  title: string
  items: string[]
}) {
  return (
    <div className="flex gap-3 sm:gap-6">
      {/* Timeline marker */}
      <div className="flex flex-col items-center">
        <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full border-2 flex items-center justify-center font-bold text-xs sm:text-sm ${
          status === 'current' 
            ? 'border-verified bg-verified/10 text-primary shadow-md shadow-verified/20' 
            : status === 'completed'
            ? 'border-verified bg-verified/5 text-verified'
            : 'border-border bg-background text-muted-foreground'
        }`}>
          {quarter.slice(0, 2)}
        </div>
        <div className="w-px h-full bg-border mt-2" />
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-6 sm:pb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground">{title}</h3>
          {status === 'current' && (
            <span className="px-2 sm:px-3 py-1 text-xs rounded-full border border-verified bg-verified/10 text-primary font-medium shadow-md shadow-verified/20 whitespace-nowrap">
              Current
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{quarter}</p>
        <ul className="space-y-1 sm:space-y-2">
          {items.map((item, index) => {
            const hasCheckmark = item.includes('✅')
            return (
              <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className={`mt-1 flex-shrink-0 ${hasCheckmark ? 'text-verified' : 'text-primary'}`}>
                  {hasCheckmark ? '✓' : '•'}
                </span>
                <span>{item.replace('✅', '').trim()}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}


