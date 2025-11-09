'use client';

import { useEffect, useState } from 'react';
import { Check, CheckCircle, FlaskConical, Leaf, Link2, Package, Shield, Store } from 'lucide-react';

export function VerificationFlow() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 15000; // 15 second loop (slower, more deliberate)
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) % duration;
      const newProgress = (elapsed / duration) * 100;

      setProgress(newProgress);

      requestAnimationFrame(animate);
    };

    const animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const stages = [
    { id: 'source', label: 'Source', icon: Leaf, position: 0 },
    { id: 'test', label: 'Test', icon: FlaskConical, position: 14.28 },
    { id: 'certify', label: 'Certify', icon: Shield, position: 28.57 },
    { id: 'record', label: 'Record', icon: Link2, position: 42.86 },
    { id: 'track', label: 'Track', icon: Package, position: 57.14 },
    { id: 'scan', label: 'Scan', icon: Store, position: 71.43 },
    { id: 'verified', label: 'Verified', icon: CheckCircle, position: 85.71 },
  ];

  const getStageOpacity = (stagePosition: number) => {
    let distance = Math.abs(progress - stagePosition);
    // Handle wrap-around at the loop point (100 -> 0)
    if (distance > 50) {
      distance = 100 - distance;
    }

    // Icons stay visible with gradient opacity
    if (distance < 7) {
      return 1;
    } else if (distance < 20) {
      const fade = (20 - distance) / 13;
      return 0.5 + fade * 0.5; // Fade from 1 to 0.5
    } else if (distance < 40) {
      const fade = (40 - distance) / 20;
      return 0.3 + fade * 0.2; // Fade from 0.5 to 0.3
    } else {
      return 0.3; // Always slightly visible
    }
  };

  const getLabelOpacity = (stagePosition: number) => {
    let distance = Math.abs(progress - stagePosition);
    // Handle wrap-around at the loop point (100 -> 0)
    if (distance > 50) {
      distance = 100 - distance;
    }

    // Match icon active state - visible when icon is active
    if (distance < 10) {
      return 1; // Fully visible when icon is active
    } else if (distance < 13) {
      const fade = (13 - distance) / 3;
      return fade; // Quick fade out after icon becomes inactive
    } else {
      return 0; // Fully hidden
    }
  };

  const getStageScale = (stagePosition: number) => {
    let distance = Math.abs(progress - stagePosition);
    // Handle wrap-around at the loop point (100 -> 0)
    if (distance > 50) {
      distance = 100 - distance;
    }

    // Match the tighter opacity curve
    if (distance < 7) {
      const scaleFactor = (7 - distance) / 7;
      return 1 + scaleFactor * 0.12;
    } else {
      return 1;
    }
  };

  // Get the currently active stage label with opacity
  const getActiveLabel = () => {
    // Find the stage with highest opacity (most active)
    let maxOpacity = 0;
    let activeStage = stages[0];
    
    for (const stage of stages) {
      const opacity = getStageOpacity(stage.position);
      if (opacity > maxOpacity) {
        maxOpacity = opacity;
        activeStage = stage;
      }
    }
    
    return { label: activeStage.label, opacity: maxOpacity };
  };

  const activeLabel = getActiveLabel();

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-1 sm:px-4">
      {/* Subtitle with animated label synchronized with icon animation - ABOVE icons */}
      <div className="text-center mb-8 h-8 flex items-center justify-center relative">
        {/* Render all labels with individual opacity - only the active one is visible */}
        <div className="relative min-w-[120px] h-8 flex items-center justify-center">
          {stages.map((stage) => {
            let distance = Math.abs(progress - stage.position);
            if (distance > 50) {
              distance = 100 - distance;
            }
            
            // Active if within 8% distance
            const isActive = distance < 8;
            
            const opacity = isActive ? getLabelOpacity(stage.position) : 0;
            const scale = getStageScale(stage.position);
            
            return (
              <span
                key={stage.id}
                className="absolute font-semibold text-lg"
                style={{
                  opacity: opacity,
                  color: opacity > 0.8 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  transform: `scale(${scale}) translateY(${20 - opacity * 20}px)`,
                  transition: 'opacity 400ms ease-out, transform 400ms ease-out, color 400ms ease-out',
                  willChange: 'opacity, transform, color',
                  pointerEvents: 'none',
                }}
              >
                {stage.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Stage Markers */}
      <div className="relative">
        <div className="grid grid-cols-7 gap-3 sm:gap-5">
          {stages.map((stage) => {
            const opacity = getStageOpacity(stage.position);
            const scale = getStageScale(stage.position);
            let distance = Math.abs(progress - stage.position);
            // Handle wrap-around for active state
            if (distance > 50) {
              distance = 100 - distance;
            }
            // Active if within 10% distance
            const isActive = distance < 10;

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center gap-2 sm:gap-3"
                style={{
                  opacity,
                  transform: `scale3d(${scale}, ${scale}, 1) translateZ(0)`,
                  transition: 'opacity 600ms ease-out, transform 600ms ease-out',
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden',
                  WebkitFontSmoothing: 'antialiased',
                }}
              >
                {/* Icon Circle */}
                <div
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${
                      isActive
                        ? 'border-verified bg-verified/10 shadow-md shadow-verified/20'
                        : 'border-border bg-background'
                    }
                  `}
                  style={{
                    transition:
                      'border-color 600ms ease-out, background-color 600ms ease-out, box-shadow 600ms ease-out',
                    willChange: 'border-color, background-color, box-shadow',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <stage.icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                    style={{
                      strokeWidth: 2,
                      transition: 'color 600ms ease-out',
                    }}
                  />
                </div>

                {/* Label */}
                {/* Removed text labels to focus on icon animation */}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tagline with checkmark */}
      <div className="flex items-center justify-center gap-2 mt-8">
        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-sm sm:text-base text-muted-foreground font-medium">
          Blockchain-verified supply chain integrity.
        </p>
      </div>
    </div>
  );
}
