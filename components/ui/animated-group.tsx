"use client";
import { motion, Variants } from "framer-motion";
import React, { ReactNode } from "react";

type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  variants?: {
    container?: any;
    item?: any;
  };
};

export function AnimatedGroup({
  children,
  className,
  variants,
}: AnimatedGroupProps) {
  const containerVariants = variants?.container || {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Use the provided item variant, or a default one if not provided but container is.
  // If specific variants are passed (like transitionVariants in hero-section), use them directly.
  // However, the component expects separated container/item usually if using AnimatedGroup.
  // If the user passed a flat variants object (like the transitionVariants example), it might be intended for the item.
  // Let's look at hero-section usage again.

  // In hero-section:
  // variants={transitionVariants} where transitionVariants = { item: { hidden:..., visible:... } }
  // So variants.item exists.

  const itemVariants = variants?.item || {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  );
}
