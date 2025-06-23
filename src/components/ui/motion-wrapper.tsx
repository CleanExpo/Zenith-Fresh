'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionWrapperProps {
  children: ReactNode;
  initial?: any;
  animate?: any;
  whileInView?: any;
  transition?: any;
  className?: string;
}

export const MotionDiv = ({ children, ...props }: MotionWrapperProps) => {
  return <motion.div {...props}>{children}</motion.div>;
};

export const MotionWrapper = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};
