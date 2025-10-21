import type { Wine } from "@/app/actions/wines";

// WineSelection agora é apenas um alias para Wine
// A seleção é mantida apenas no contexto via selectedWineIds
export type WineSelection = Wine;
