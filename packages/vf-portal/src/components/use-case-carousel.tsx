'use client';

import { useState } from 'react';
import { Award, Leaf, MoveHorizontal, Store, User } from 'lucide-react';

interface DragState {
  id?: number;
  startX?: number;
  startY?: number;
  currentX?: number;
  currentY?: number;
  isDragging?: boolean;
  removing?: boolean;
}

const useCases = [
  {
    id: 1,
    icon: User,
    title: "Sarah's Coffee Break",
    role: 'Conscious Consumer',
    scenario: 'Sarah scans an oat milk carton at her local café.',
    result:
      'In 0.3 seconds: Swedish oats, verified vegan farms, no animal products in the entire supply chain.',
    impact: '100% certainty her choice is plant-based.',
    bgColor: '#F6C638',
  },
  {
    id: 2,
    icon: Leaf,
    title: 'Green Valley Farms',
    role: 'Organic Producer',
    scenario: 'A small California farm grows organic strawberries using plant-based fertilizers.',
    result:
      'Every harvest logged on blockchain. Customers trace berries to specific fields and growing practices.',
    impact: 'Transparent practices = premium prices.',
    bgColor: '#9DC491',
  },
  {
    id: 3,
    icon: Store,
    title: 'Whole Earth Market',
    role: 'Ethical Retailer',
    scenario: "A grocery chain wants to guarantee their 'vegan' section is 100% animal-free.",
    result:
      'Complete supply chain verification on every product. Customers scan and verify instantly.',
    impact: 'Increase in customer loyalty.',
    bgColor: '#FE8E4B',
  },
  {
    id: 4,
    icon: Award,
    title: 'VegCert International',
    role: 'Certification Body',
    scenario: 'A certification org manages thousands of digital vegan certificates with complex global verification processes.',
    result: 'Switch to blockchain: unforgeable, instantly verifiable, much cheaper to issue.',
    impact: 'Certificate fraud becomes impossible.',
    bgColor: '#F6C638',
  },
];

export function UseCaseCarousel() {
  const [currentCards, setCurrentCards] = useState(useCases);
  const [dragState, setDragState] = useState<DragState>({});

  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    id: number
  ) => {
    // Stop propagation to prevent affecting other elements like the nav menu
    e.stopPropagation();
    
    // DON'T preventDefault on touchstart - wait to see user's intent first
    // This allows normal touch behavior until we confirm horizontal swipe

    const startX =
      e.type === 'mousedown'
        ? (e as React.MouseEvent<HTMLDivElement>).clientX
        : (e as React.TouchEvent<HTMLDivElement>).touches[0].clientX;
    const startY =
      e.type === 'mousedown'
        ? (e as React.MouseEvent<HTMLDivElement>).clientY
        : (e as React.TouchEvent<HTMLDivElement>).touches[0].clientY;
    setDragState({ id, startX, startY, currentX: 0, currentY: 0, isDragging: true });
  };

  const handleDragMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!dragState.isDragging) return;

    const clientX =
      e.type === 'mousemove'
        ? (e as React.MouseEvent<HTMLDivElement>).clientX
        : (e as React.TouchEvent<HTMLDivElement>).touches[0].clientX;
    const clientY =
      e.type === 'mousemove'
        ? (e as React.MouseEvent<HTMLDivElement>).clientY
        : (e as React.TouchEvent<HTMLDivElement>).touches[0].clientY;
    const deltaX = clientX - (dragState.startX ?? 0);
    const deltaY = clientY - (dragState.startY ?? 0);

    // Check if movement is predominantly horizontal
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // For mouse events, only prevent default when clearly horizontal
    if (e.type === 'mousemove' && absX > absY && absX > 5) {
      e.preventDefault();
      e.stopPropagation();
      setDragState((prev) => ({ ...prev, currentX: deltaX, currentY: 0 }));
    }
    // For touch events, only continue if horizontal movement dominates
    else if (e.type.includes('touch')) {
      // Stop propagation to keep touch events contained to the carousel
      e.stopPropagation();
      
      if (absY > absX && absY > 10) {
        // Vertical movement detected - cancel drag to allow page scrolling
        setDragState({});
      } else if (absX > 5) {
        // Horizontal movement detected - prevent default and update position
        e.preventDefault();
        setDragState((prev) => ({ ...prev, currentX: deltaX, currentY: 0 }));
      }
    }
  };  const handleDragEnd = () => {
    if (!dragState.isDragging) return;

    const threshold = 100;
    const { currentX, id } = dragState;

    if (Math.abs(currentX ?? 0) > threshold) {
      // Animate card off screen
      const direction = (currentX ?? 0) > 0 ? 1000 : -1000;
      setDragState((prev) => ({
        ...prev,
        currentX: direction,
        removing: true,
        isDragging: false,
      }));

      // Move card to back of stack
      setTimeout(() => {
        setCurrentCards((prev) => {
          const removed = prev.find((c) => c.id === id);
          if (!removed) return prev;
          const remaining = prev.filter((c) => c.id !== id);
          return [...remaining, removed];
        });
        setDragState({});
      }, 300);
    } else {
      setDragState({});
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-0 relative" style={{ isolation: 'isolate' }}>
      {/* Card Stack */}
      <div className="relative h-[410px] md:h-[520px] max-w-xs md:max-w-md mx-auto mb-8">
        {currentCards.map((card, index) => {
          const Icon = card.icon;
          const isTop = index === 0;
          const isBeingDragged = dragState.id === card.id;
          const isRemoving = isBeingDragged && dragState.removing;
          const x = isBeingDragged ? (dragState.currentX ?? 0) : 0;
          const rotation = isBeingDragged ? (dragState.currentX ?? 0) / 10 : 0;
          const opacity = isRemoving
            ? 0
            : isBeingDragged
              ? Math.max(0.7, 1 - Math.abs(dragState.currentX ?? 0) / 300)
              : 1;
          const scale = isRemoving ? 0.8 : 1 - index * 0.04; // Fixed scale value
          const translateY = index * -4;

          return (
            <div
              key={card.id}
              className={`absolute inset-0 select-none ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
              style={{
                transform: `translateX(${x}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale}) rotate(${index > 0 ? '-3deg' : '0deg'})`,
                transition:
                  isBeingDragged && !isRemoving ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: currentCards.length - index,
                opacity: index < 3 ? opacity : 0,
                pointerEvents: isTop && !isRemoving ? 'auto' : 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                // Allow vertical panning (scrolling) but let JS handle horizontal
                touchAction: 'pan-y pinch-zoom',
              }}
              onMouseDown={isTop ? (e) => handleDragStart(e, card.id) : undefined}
              onMouseMove={isTop && dragState.isDragging ? handleDragMove : undefined}
              onMouseUp={isTop && dragState.isDragging ? handleDragEnd : undefined}
              onMouseLeave={isTop && dragState.isDragging ? handleDragEnd : undefined}
              onTouchStart={isTop ? (e) => handleDragStart(e, card.id) : undefined}
              onTouchMove={isTop && dragState.isDragging ? handleDragMove : undefined}
              onTouchEnd={isTop && dragState.isDragging ? handleDragEnd : undefined}
              onTouchCancel={isTop && dragState.isDragging ? handleDragEnd : undefined}
            >
              <div className="w-full h-full rounded-2xl border-2 border-border bg-card shadow-2xl p-4 md:p-6 flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-verified/10 border border-verified flex items-center justify-center flex-shrink-0 shadow-md shadow-verified/20">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">
                      {card.title}
                    </h3>
                    <p className="text-sm text-primary font-medium">{card.role}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-5 flex-1">
                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Scenario
                    </h4>
                    <p className="text-sm md:text-base text-foreground leading-relaxed">
                      {card.scenario}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Our Solution
                    </h4>
                    <p className="text-sm md:text-base text-foreground leading-relaxed">
                      {card.result}
                    </p>
                  </div>

                  <div className="pt-3 mt-auto">
                    <p className="text-sm md:text-base text-primary font-semibold">
                      ✓ {card.impact}
                    </p>
                  </div>
                </div>

                {/* Swipe Indicator - Only on top card */}
                {isTop && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-muted-foreground opacity-50">
                    <MoveHorizontal className="w-5 h-5 animate-pulse text-verified" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {useCases.map((card) => {
          const currentTopCard = currentCards[0];
          const isActive = card.id === currentTopCard.id;
          return (
            <div
              key={card.id}
              className={`transition-all duration-300 rounded-full ${
                isActive ? 'w-8 h-2 bg-primary' : 'w-2 h-2 bg-border'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
