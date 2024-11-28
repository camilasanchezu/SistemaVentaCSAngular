import { CompararVentasDTO } from "./comparar-venta"; // Importamos la interfaz CompararVentasDTO

export interface CompararVentasResponse {
  status: boolean;
  value: CompararVentasDTO[]; // Usamos la interfaz importada aquí
  msg: string | null;
}
