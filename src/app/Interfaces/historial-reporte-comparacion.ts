export interface ComparacionVentasDTO {
  idProducto: number;
  nombreProducto: string;
  cantidadVendida: number;
  porcentajeVenta: number;
  tipoPago: string;
  numeroDocumento: string;
}

export interface ResponseApi<T> {
  status: boolean;
  value: T;
  message?: string;
}

