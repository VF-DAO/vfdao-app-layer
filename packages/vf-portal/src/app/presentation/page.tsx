import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function PresentationPage() {
  return (
    <div className="min-h-screen px-4 py-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="space-y-6">
          <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium">
            Full Vision Document
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            VeganFriends DAO Presentation
          </h1>

          <p className="text-xl text-muted-foreground">
            Complete vision, technology stack, roadmap, and architecture
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="p-8 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-4 mb-6">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">PRESENTATION.md</h2>
                <p className="text-muted-foreground">
                  Complete presentation document with animation specifications
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">This comprehensive document contains:</p>

            <ul className="space-y-2 text-muted-foreground mb-8">
              <li>✓ Complete vision and mission</li>
              <li>✓ Problem/solution deep dive</li>
              <li>✓ Interactive flow diagrams</li>
              <li>✓ Stakeholder benefits</li>
              <li>✓ Technology architecture</li>
              <li>✓ Detailed roadmap (Q1 2025 → 2026)</li>
              <li>✓ Animation specifications</li>
              <li>✓ Developer implementation guide</li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/PRESENTATION.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
              >
                View Full Document
                <FileText className="w-5 h-5" />
              </a>

              <a
                href="https://github.com/VFDAO-Builders/vfdao-eco-engine/blob/main/PRESENTATION.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-card border border-border hover:bg-muted text-card-foreground px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Quick Preview Sections */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-foreground">Document Sections</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard
              title="Hero & Overview"
              description="Tagline, elevator pitch, visual direction"
            />
            <SectionCard title="Problem Analysis" description="Current certification challenges" />
            <SectionCard title="Our Solution" description="VeganFriends DAO platform overview" />
            <SectionCard title="How It Works" description="Complete verification flow" />
            <SectionCard title="Benefits" description="Value for all stakeholders" />
            <SectionCard title="Technology" description="NEAR, OnSocial, Smart Contracts" />
            <SectionCard title="Roadmap" description="Q1 2025 through 2026 vision" />
            <SectionCard title="Call to Action" description="Join the movement" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card hover:bg-card/80 transition-all">
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
