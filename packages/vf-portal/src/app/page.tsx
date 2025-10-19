'use client';

import { ArrowRight, Leaf, Scan, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VerificationFlow } from '@/components/verification-flow';
import { UseCaseCarousel } from '@/components/use-case-carousel';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col">
        {/* Hero Section - Mission-Driven */}
        <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            {/* Subtle Dot Grid Background - Represents verification checkpoints */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.08)_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1.5px,transparent_1.5px)] bg-[size:40px_40px]" />
            <div className="text-center space-y-6 sm:space-y-8 md:space-y-12 max-w-5xl mx-auto relative z-10">
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tighter sm:tracking-tight leading-tight">
                Don't trust.
                <br />
                It's already <span className="text-verified">verified.</span>
              </h1>
              <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Permissionless access. Record. Scan. Verify. Vegan ingredients, fully transparent.
              </p>
            </div>
          </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section - Mission-Driven */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          {/* Subtle Dot Grid Background - Represents verification checkpoints */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.08)_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1.5px,transparent_1.5px)] bg-[size:40px_40px]" />

          <div className="text-center max-w-5xl mx-auto relative z-10">
          {/* Main Headline */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tighter sm:tracking-tight leading-tight">
              Don't trust.
              <br />
              It's already <span className="text-verified">verified.</span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Permissionless access. Record. Scan. Verify. Vegan ingredients, fully transparent.
            </p>
          </div>

          {/* Simple Explanation */}
          <div className="inline-flex items-center px-3 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mt-8 sm:mt-12">
            Launching Q1 2026
          </div>

          {/* Verification Flow Animation */}
          <div className="mt-0">
            <VerificationFlow />
          </div>

          {/* CTAs */}
                    {/* CTAs */}
          <div className="flex flex-row gap-4 justify-center w-full flex-wrap">
            <Link
              href="#learn-more"
              className="inline-flex items-center justify-center gap-2 border border-primary bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full font-semibold transition-all hover:shadow-md hover:shadow-primary/10 group text-sm md:text-base whitespace-nowrap"
            >
              Learn More
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </Link>

            <Link
              href="#community"
              className="inline-flex items-center justify-center gap-2 border border-verified hover:border-verified/80 text-primary hover:text-primary px-3 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full font-semibold transition-all hover:shadow-md hover:shadow-verified/10 group text-sm md:text-base whitespace-nowrap"
            >
              Join the Movement
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </Link>
          </div>
        </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section id="learn-more" className="py-16 sm:py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Who This Is For
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Consumers seeking truth, producers committed to ethics, and certifiers upholding standards — together we're creating a future where trust is earned, not assumed.
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
      <section id="use-cases" className="py-16 sm:py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Real-world scenarios
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              From coffee shops to farms, from retailers to certifiers — see how VeganFriends
              transforms daily decisions into verified truth.
            </p>
          </div>

          <UseCaseCarousel />
        </div>
      </section>

      {/* Timeline - The Journey Ahead */}
      <section
        id="timeline"
        className="py-16 sm:py-24 px-4 border-t border-border bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-card/30"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
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
                '$VF token launched with initial liquidity ✅',
                'OnSocial Protocol contracts in testing',
                'Verification system architected',
                'Community growth & partnerships',
              ]}
            />

            <TimelineItem
              quarter="Q1 2026"
              status="upcoming"
              title="Smart Contracts Go Live"
              items={[
                'OnSocial Protocol mainnet deployment',
                'Core supply chain tracking contracts live',
                'Security audits completed',
              ]}
            />

            <TimelineItem
              quarter="Q2 2026"
              status="upcoming"
              title="Infrastructure Build"
              items={[
                'Stakeholder portals development',
                'Consumer app',
                'Substreams indexer deployment',
              ]}
            />

            <TimelineItem
              quarter="Q3 2026"
              status="upcoming"
              title="Initial Onboarding"
              items={[
                'First certification bodies onboarded',
                'Pilot producers begin tracking',
                'Beta testing with early adopters',
              ]}
            />

            <TimelineItem
              quarter="Q4 2026"
              status="upcoming"
              title="Public Launch"
              items={[
                'Consumer app launches',
                'First products fully tracked farm-to-shelf',
                'Public marketplace opens',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Community - Build Transparency Together */}
      <section id="community" className="py-16 sm:py-24 px-4 border-t border-border bg-muted/30">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Build Transparency Together
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Every verified product and shared story matters. Join our community of builders, believers, and changemakers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 pt-8">
            <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">Early Adopter</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be first to try the platform when we launch
              </p>
              <Link
                href="https://t.me/veganfriendsdao"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:gap-3 transition-all"
              >
                Get Early Access
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-verified flex-shrink-0" />
              </Link>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">
                Community Member
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                You love being part of a vegan community.
              </p>
              <Link
                href="https://t.me/veganfriendsdao"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:gap-3 transition-all"
              >
                Join Telegram
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-verified flex-shrink-0" />
              </Link>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">Partner</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bring your brand or certification body onboard
              </p>
              <Link
                href="#partners"
                className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:gap-3 transition-all"
              >
                Get in Touch
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-verified flex-shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Stakeholder Card Component
function StakeholderCard({
  icon,
  title,
  description,
  pain,
  solution,
  cta,
  ctaHref,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  pain: string;
  solution: string;
  cta: string;
  ctaHref: string;
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
        <p className="text-sm md:text-base text-muted-foreground">{description}</p>

        {/* Pain Point */}
        <p className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3 sm:pl-4">
          {pain}
        </p>

        {/* Solution */}
        <p className="text-sm md:text-base text-foreground font-medium">{solution}</p>
      </div>

      {/* CTA */}
      <div className="mt-4 sm:mt-6">
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:gap-3 transition-all group"
        >
          {cta}
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-verified flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}

// Timeline Item Component
function TimelineItem({
  quarter,
  status,
  title,
  items,
}: {
  quarter: string;
  status: 'current' | 'upcoming' | 'completed';
  title: string;
  items: string[];
}) {
  return (
    <div className="flex gap-3 sm:gap-6">
      {/* Timeline marker */}
      <div className="flex flex-col items-center">
        <div
          className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
            status === 'current'
              ? 'border-verified bg-verified/10 text-primary shadow-md shadow-verified/20'
              : status === 'completed'
                ? 'border-verified bg-verified/5 text-verified'
                : 'border-border bg-background text-muted-foreground'
          }`}
        >
          {quarter.slice(0, 2)}
        </div>
        <div className="w-px h-full bg-border mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 sm:pb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground">
            {title}
          </h3>
          {status === 'current' && (
            <span className="px-2 sm:px-3 py-1 text-sm rounded-full border border-verified bg-verified/10 text-primary font-medium shadow-md shadow-verified/20 whitespace-nowrap">
              Current
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2 sm:mb-3">{quarter}</p>
        <ul className="space-y-1 sm:space-y-2">
          {items.map((item, index) => {
            const hasCheckmark = item.includes('✅');
            return (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span
                  className={`mt-1 flex-shrink-0 ${hasCheckmark ? 'text-verified' : 'text-primary'}`}
                >
                  {hasCheckmark ? '✓' : '•'}
                </span>
                <span>{item.replace('✅', '').trim()}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
