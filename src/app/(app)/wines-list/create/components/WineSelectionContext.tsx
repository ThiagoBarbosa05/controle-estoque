"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { WineSelection } from "./WineSelection.types";

interface WineSelectionContextProps {
  selectedWines: WineSelection[];
  selectedWineIds: Set<string>;
  toggleWine: (wine: WineSelection) => void;
  clearSelection: () => void;
  selectAll: (wines: WineSelection[]) => void;
}

const WineSelectionContext = createContext<
  WineSelectionContextProps | undefined
>(undefined);

export const WineSelectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedWines, setSelectedWines] = useState<WineSelection[]>([]);
  const [selectedWineIds, setSelectedWineIds] = useState<Set<string>>(
    new Set()
  );

  const toggleWine = useCallback((wine: WineSelection) => {
    setSelectedWines((prevArr) => {
      const isSelected = prevArr.some((w) => w.id === wine.id);

      if (isSelected) {
        // Remover vinho
        setSelectedWineIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(wine.id);
          return newSet;
        });
        return prevArr.filter((w) => w.id !== wine.id);
      } else {
        // Adicionar vinho
        setSelectedWineIds((prev) => new Set([...prev, wine.id]));
        return [...prevArr, wine];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedWineIds(new Set());
    setSelectedWines([]);
  }, []);

  const selectAll = useCallback((wines: WineSelection[]) => {
    setSelectedWineIds(new Set(wines.map((w) => w.id)));
    setSelectedWines(wines);
  }, []);

  const contextValue = useMemo(
    () => ({
      selectedWines,
      selectedWineIds,
      toggleWine,
      clearSelection,
      selectAll,
    }),
    [selectedWines, selectedWineIds, toggleWine, clearSelection, selectAll]
  );

  return (
    <WineSelectionContext.Provider value={contextValue}>
      {children}
    </WineSelectionContext.Provider>
  );
};

export function useWineSelection() {
  const context = useContext(WineSelectionContext);
  if (!context)
    throw new Error(
      "useWineSelection must be used within WineSelectionProvider"
    );
  return context;
}
