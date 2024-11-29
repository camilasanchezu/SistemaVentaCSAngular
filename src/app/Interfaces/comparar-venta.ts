export interface CompararVentasDTO {
  totalMes: number;
  diferencia: number;
  estadoComparacion: string;
  porcentajeCambio?: string; // Agregamos esta nueva propiedad opcional
}
