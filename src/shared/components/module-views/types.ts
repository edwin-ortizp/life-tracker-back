import type React from 'react';

export type ModuleViewDefinition<TProps = Record<string, never>> = {
  key: string;
  label: string;
  component: React.ComponentType<TProps>;
};

export type ModuleViewAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
  className?: string;
  showLabel?: boolean;
  dropdown?: Array<{
    label: string;
    onClick: () => void;
  }>;
};
