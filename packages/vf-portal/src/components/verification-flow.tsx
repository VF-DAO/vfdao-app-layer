'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, FlaskConical, Leaf, Link2, Package, Shield, Store } from 'lucide-react';

export function VerificationFlow() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 8000; // 8 second loop (fast and dynamic)
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime % duration;
      const newProgress = (elapsed / duration) * 100;

      // Force update by using functional setState
      setProgress((prev) => {
        const diff = Math.abs(prev - newProgress);
        // Only update if there's meaningful change
        return diff > 0.1 ? newProgress : prev;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation with a timestamp
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const stages = [
    { id: 'ingredients', label: 'Ingredients', icon: Leaf, position: 0 },
    { id: 'lab', label: 'Lab Test', icon: FlaskConical, position: 16.67 },
    { id: 'cert', label: 'Certify', icon: Shield, position: 33.33 },
    { id: 'blockchain', label: 'Blockchain', icon: Link2, position: 50 },
    { id: 'supply', label: 'Supply Chain', icon: Package, position: 66.67 },
    { id: 'retail', label: 'Retail', icon: Store, position: 83.33 },
    { id: 'verified', label: 'Verified', icon: CheckCircle, position: 100 },
  ];

  const getStageOpacity = (stagePosition: number) => {
    let distance = Math.abs(progress - stagePosition);
    // Handle wrap-around at the loop point (100 -> 0)
    if (distance > 50) {
      distance = 100 - distance;
    }

    // Smooth gradient curve for opacity
    if (distance < 10) {
      return 1;
    } else if (distance < 25) {
      const fade = (25 - distance) / 15;
      return 0.5 + fade * 0.5; // Smooth fade from 1 to 0.5
    } else if (distance < 45) {
      const fade = (45 - distance) / 20;
      return 0.3 + fade * 0.2; // Smooth fade from 0.5 to 0.3
    } else {
      return 0.3;
    }
  };

  const getStageScale = (stagePosition: number) => {
    let distance = Math.abs(progress - stagePosition);
    // Handle wrap-around at the loop point (100 -> 0)
    if (distance > 50) {
      distance = 100 - distance;
    }

    // Smooth gradient curve for scale - using fixed value since we removed isMobile
    if (distance < 10) {
      const scaleFactor = (10 - distance) / 10;
      return 1 + scaleFactor * 0.12; // Middle ground between mobile and desktop
    } else {
      return 1;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-1 sm:px-4">
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
            // Prevent both first and last from being active simultaneously
            const isActive =
              distance < 10 &&
              !(stage.position === 0 && progress > 90) &&
              !(stage.position === 100 && progress < 10);

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

      {/* Subtitle */}
      <div className="text-center mt-8">
        <p className="text-sm text-primary font-medium inline-flex items-center gap-2 justify-center">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Blockchain-verified supply chain integrity.</span>
        </p>
      </div>
    </div>
  );
}
