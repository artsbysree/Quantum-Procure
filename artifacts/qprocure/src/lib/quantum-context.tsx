import { createContext, useContext, useState, ReactNode } from 'react';
import type { QuantumOptimizeResult } from '@workspace/api-client-react';

export type { QuantumOptimizeResult };

interface QuantumContextType {
  lastResult: QuantumOptimizeResult | null;
  setLastResult: (result: QuantumOptimizeResult | null) => void;
}

const QuantumContext = createContext<QuantumContextType | undefined>(undefined);

export function QuantumProvider({ children }: { children: ReactNode }) {
  const [lastResult, setLastResult] = useState<QuantumOptimizeResult | null>(null);

  return (
    <QuantumContext.Provider value={{ lastResult, setLastResult }}>
      {children}
    </QuantumContext.Provider>
  );
}

export function useQuantum() {
  const context = useContext(QuantumContext);
  if (context === undefined) {
    throw new Error('useQuantum must be used within a QuantumProvider');
  }
  return context;
}
