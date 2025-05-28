import type { ReactNode } from 'react';

export interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  trend?: number;
}

export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
} 