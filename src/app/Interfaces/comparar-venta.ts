export interface CompararVentasDTO {
  totalMes: number;
  diferencia: number;
  estadoComparacion: string;
  porcentajeAumento?: number; // Agregar este campo para los porcentajes
}
