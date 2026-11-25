import { createContext, useContext } from 'react';

// Opening a drill from anywhere inside the chart stack: a figure calls openDrill(spec) and the
// DashboardDrillSheet (mounted by DashboardView) presents itself. Mirrors the web's DrillContext.
export type OpenDashDrill = (spec: string) => void;

export const DashboardDrillContext = createContext<OpenDashDrill | null>(null);

export const useDashDrill = (): OpenDashDrill | null => useContext(DashboardDrillContext);
