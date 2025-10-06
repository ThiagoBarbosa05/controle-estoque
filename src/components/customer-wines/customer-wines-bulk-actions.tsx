// // import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Users, Wine, Download, CheckSquare } from "lucide-react";

// interface CustomerWine {
//   id: string;
//   customerId: string;
//   wineId: string;
//   customer: {
//     id: string;
//     name: string;
//   };
//   wine: {
//     id: string;
//     name: string;
//     type: string;
//     country: string;
//     discontinued: boolean;
//   };
// }

// interface CustomerWinesBulkActionsProps {
//   customerWines: CustomerWine[];
//   currentCustomerId?: string;
//   onRefresh?: () => void;
// }

// export function CustomerWinesBulkActions({
//   customerWines,
// }: CustomerWinesBulkActionsProps) {
//   // const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
//   // const [isSelectionMode, setIsSelectionMode] = useState(false);

//   // Verificar se todos os itens estão selecionados
//   const isAllSelected =
//     selectedItems.size === customerWines.length && customerWines.length > 0;
//   const isSomeSelected =
//     selectedItems.size > 0 && selectedItems.size < customerWines.length;

//   // Alternar seleção de todos os itens
//   const toggleSelectAll = () => {
//     if (isAllSelected) {
//       setSelectedItems(new Set());
//     } else {
//       setSelectedItems(new Set(customerWines.map((cw) => cw.id)));
//     }
//   };

//   // Alternar seleção de um item
//   const toggleSelectItem = (itemId: string) => {
//     const newSelection = new Set(selectedItems);
//     if (newSelection.has(itemId)) {
//       newSelection.delete(itemId);
//     } else {
//       newSelection.add(itemId);
//     }
//     setSelectedItems(newSelection);
//   };

//   // Limpar seleções e sair do modo de seleção
//   const clearSelection = () => {
//     setSelectedItems(new Set());
//     setIsSelectionMode(false);
//   };

//   // Exportar lista selecionada
//   const handleExportSelected = () => {
//     if (selectedItems.size === 0) return;

//     const selectedWines = customerWines.filter((cw) =>
//       selectedItems.has(cw.id)
//     );
//     const csvContent = [
//       "Cliente,Vinho,Tipo,País,Status",
//       ...selectedWines.map(
//         (cw) =>
//           `"${cw.customer.name}","${cw.wine.name}","${cw.wine.type}","${
//             cw.wine.country
//           }","${cw.wine.discontinued ? "Descontinuado" : "Ativo"}"`
//       ),
//     ].join("\n");

//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = `vinhos_selecionados_${
//       new Date().toISOString().split("T")[0]
//     }.csv`;
//     link.click();

//     console.log(`${selectedItems.size} itens exportados`);
//   };

//   if (!isSelectionMode && customerWines.length === 0) {
//     return null;
//   }

//   return (
//     <Card className="border-dashed">
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <div>
//             <CardTitle className="flex items-center gap-2">
//               <CheckSquare className="h-5 w-5" />
//               Ações em Massa
//               {selectedItems.size > 0 && (
//                 <Badge variant="secondary">
//                   {selectedItems.size} selecionado
//                   {selectedItems.size !== 1 ? "s" : ""}
//                 </Badge>
//               )}
//             </CardTitle>
//             <CardDescription>
//               {isSelectionMode
//                 ? "Selecione os itens para realizar ações em massa"
//                 : "Ative o modo de seleção para gerenciar múltiplos itens"}
//             </CardDescription>
//           </div>
//           <div className="flex items-center gap-2">
//             {!isSelectionMode ? (
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setIsSelectionMode(true)}
//                 disabled={customerWines.length === 0}
//               >
//                 <CheckSquare className="h-4 w-4 mr-2" />
//                 Selecionar Itens
//               </Button>
//             ) : (
//               <Button variant="outline" size="sm" onClick={clearSelection}>
//                 Cancelar
//               </Button>
//             )}
//           </div>
//         </div>
//       </CardHeader>

//       {isSelectionMode && (
//         <CardContent className="space-y-4">
//           {/* Controles de seleção */}
//           <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
//             <div className="flex items-center space-x-2">
//               <Checkbox
//                 checked={isAllSelected}
//                 onCheckedChange={toggleSelectAll}
//               />
//               <span className="text-sm font-medium">
//                 {isAllSelected
//                   ? "Desmarcar todos"
//                   : isSomeSelected
//                   ? "Selecionar todos"
//                   : "Selecionar todos"}
//               </span>
//             </div>
//             <div className="text-sm text-muted-foreground">
//               {customerWines.length} itens disponíveis
//             </div>
//           </div>

//           {/* Lista de itens com checkboxes */}
//           <div className="space-y-2 max-h-60 overflow-y-auto">
//             {customerWines.map((customerWine) => (
//               <div
//                 key={customerWine.id}
//                 className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
//                   selectedItems.has(customerWine.id)
//                     ? "bg-primary/5 border-primary/20"
//                     : "hover:bg-muted/50"
//                 }`}
//               >
//                 <Checkbox
//                   checked={selectedItems.has(customerWine.id)}
//                   onCheckedChange={() => toggleSelectItem(customerWine.id)}
//                 />
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2">
//                     <Wine className="h-4 w-4 text-muted-foreground flex-shrink-0" />
//                     <span className="font-medium truncate">
//                       {customerWine.wine.name}
//                     </span>
//                     <Badge variant="outline" className="text-xs flex-shrink-0">
//                       {customerWine.wine.type}
//                     </Badge>
//                   </div>
//                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                     <Users className="h-3 w-3" />
//                     <span>{customerWine.customer.name}</span>
//                     <span>•</span>
//                     <span>{customerWine.wine.country}</span>
//                   </div>
//                 </div>
//                 {customerWine.wine.discontinued && (
//                   <Badge variant="secondary" className="flex-shrink-0">
//                     Descontinuado
//                   </Badge>
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* Ações disponíveis */}
//           <div className="flex items-center gap-2 pt-4 border-t">
//             {selectedItems.size > 0 && (
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={handleExportSelected}
//               >
//                 <Download className="h-4 w-4 mr-2" />
//                 Exportar Selecionados ({selectedItems.size})
//               </Button>
//             )}

//             <div className="ml-auto text-sm text-muted-foreground">
//               {selectedItems.size} de {customerWines.length} itens selecionados
//             </div>
//           </div>
//         </CardContent>
//       )}
//     </Card>
//   );
// }
