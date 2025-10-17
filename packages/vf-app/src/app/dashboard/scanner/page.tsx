'use client'

export default function ScannerPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">Scan Product</h1>
      <p className="text-muted-foreground mb-8">Scan a product QR code to verify its complete supply chain.</p>
      
      <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
        <div className="text-5xl mb-4">📱</div>
        <h2 className="text-xl font-bold text-foreground mb-2">Product Scanner Coming Soon</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Scan any product QR code to see its complete blockchain-verified supply chain from farm to shelf.
        </p>
      </div>
    </div>
  )
}
