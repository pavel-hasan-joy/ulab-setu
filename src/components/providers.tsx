"use client";

import { MotionConfig } from "motion/react";
import { CornerBalls } from "./effects/corner-balls";
import { PagePull } from "./effects/page-pull";
import { SkyLayer } from "./effects/sky-layer";
import { Pwa } from "./pwa";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <PagePull>{children}</PagePull>
      <SkyLayer />
      <CornerBalls />
      <Pwa />
    </MotionConfig>
  );
}
