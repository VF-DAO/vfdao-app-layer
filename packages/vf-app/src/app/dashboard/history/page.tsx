'use client';

export default function HistoryPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">Verification History</h1>
      <p className="text-muted-foreground mb-8">View all products you've verified.</p>

      <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-xl font-bold text-foreground mb-2">No Verifications Yet</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Start scanning products to build your verification history and earn rewards.
        </p>
      </div>
    </div>
  );
}
