"use client";

import { MotionConfig } from "motion/react";
import { CornerBalls } from "./effects/corner-balls";
import { RouteTransition } from "./effects/route-transition";
import { SkyLayer } from "./effects/sky-layer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <SkyLayer />
      <CornerBalls />
      <RouteTransition />
    </MotionConfig>
  );
}
