"use client";

import { animate, motion, useInView, useMotionValue, useTransform, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Reveals content as it scrolls into view. */
export function Reveal({ delay = 0, y = 18, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease }}
      {...props}
    />
  );
}

/** Children animate in one after another. Wrap each child in <StaggerItem>. */
export function Stagger({ gap = 0.07, ...props }: HTMLMotionProps<"div"> & { gap?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      {...props}
    />
  );
}
export function StaggerItem(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
      {...props}
    />
  );
}

/** Card that lifts gently under the pointer. */
export function HoverLift(props: HTMLMotionProps<"div">) {
  return <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} {...props} />;
}

export function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    if (inView) animate(value, to, { duration: 1.6, ease });
  }, [inView, to, value]);
  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
}

/** Page-level entrance used by dashboard pages. */
export function PageIn(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      {...props}
    />
  );
}
