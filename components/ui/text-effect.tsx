"use client";
import { motion, Variants } from "framer-motion";
import React from "react";

type TextEffectProps = {
  children: string;
  className?: string;
  as?: React.ElementType;
  preset?: "fade-in-blur" | "fade-in" | "slide-up" | "scale";
  per?: "char" | "word" | "line";
  delay?: number;
  speedSegment?: number;
};

const defaultVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function TextEffect({
  children,
  className,
  as: Component = "p",
  preset = "fade-in-blur",
  per = "word",
  delay = 0,
  speedSegment = 0.05,
}: TextEffectProps) {
  // Simple word splitting for now. 'line' splitting would require more complex logic.
  const items = children.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: speedSegment,
        delayChildren: delay,
      },
    },
  };

  return (
    <Component className={className}>
      <motion.span
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        style={{ display: "inline-block" }}
      >
        {items.map((item, index) => (
          <motion.span
            key={index}
            variants={defaultVariants}
            style={{ display: "inline-block", marginRight: "0.25em" }}
          >
            {item}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  );
}
