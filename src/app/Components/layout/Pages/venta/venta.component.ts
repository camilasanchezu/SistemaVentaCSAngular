import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';

import { ProductoService } from 'src/app/Services/producto.service';
import { VentaService } from 'src/app/Services/venta.service';
import { UtilidadService } from 'src/app/Reutilizable/utilidad.service';

import { Producto } from 'src/app/Interfaces/producto';
import { Venta } from 'src/app/Interfaces/venta';
import { DetalleVenta } from 'src/app/Interfaces/detalle-venta';
import { ComparacionVentasDTO } from 'src/app/Interfaces/historial-reporte-comparacion';
import * as moment from 'moment';
import { MAT_DATE_FORMATS } from '@angular/material/core';

import Swal from 'sweetalert2';

export const MY_DATA_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-venta',
  templateUrl: './venta.component.html',
  styleUrls: ['./venta.component.css'],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MY_DATA_FORMATS }],
})
export class VentaComponent implements OnInit {
  listaProductos: Producto[] = [];
  listaProductosFiltro: Producto[] = [];
  listaProductosParaVenta: DetalleVenta[] = [];
  bloquearBotonRegistrar: boolean = false;
  productoSeleccionado!: Producto;
  tipodePagoPorDefecto: string = 'Efectivo';
  totalPagar: number = 0;

  columnasComparacion: string[] = [
    'idVenta',
    'fechaVenta',
    'totalVenta',
    'diferencia',
  ];

  formularioProductoVenta: FormGroup;
  columnasTabla: string[] = [
    'producto',
    'cantidad',
    'precio',
    'total',
    'accion',
  ];
  datosDetalleVenta = new MatTableDataSource(this.listaProductosParaVenta);

  // Comparación de ventas entre historial y reporte
  compararVentasForm: FormGroup;
  resultadosComparacion: ComparacionVentasDTO[] = [];

  retornarProductosPorFiltro(busqueda: any): Producto[] {
    const valorBuscado =
      typeof busqueda === 'string'
        ? busqueda.toLocaleLowerCase()
        : busqueda.nombre.toLocaleLowerCase();
    return this.listaProductos.filter((item) =>
      item.nombre.toLocaleLowerCase().includes(valorBuscado)
    );
  }

  constructor(
    private fb: FormBuilder,
    private _productoServicio: ProductoService,
    private _ventaServicio: VentaService,
    private _utilidadServicio: UtilidadService
  ) {
    this.formularioProductoVenta = this.fb.group({
      producto: ['', Validators.required],
      cantidad: ['', Validators.required],
    });

    // Formulario para comparar historial y reporte
    this.compararVentasForm = this.fb.group({
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
    });

    this._productoServicio.lista().subscribe({
      next: (data) => {
        if (data.status) {
          const lista = data.value as Producto[];
          this.listaProductos = lista.filter(
            (p) => p.esActivo == 1 && p.stock > 0
          );
        }
      },
      error: (e) => {},
    });

    this.formularioProductoVenta
      .get('producto')
      ?.valueChanges.subscribe((value) => {
        this.listaProductosFiltro = this.retornarProductosPorFiltro(value);
      });
  }

  ngOnInit(): void {}

  mostrarProducto(producto: Producto): string {
    return producto.nombre;
  }

  productoParaVenta(event: any) {
    this.productoSeleccionado = event.option.value;
  }

  agregarProductoParaVenta() {
    const _cantidad: number = this.formularioProductoVenta.value.cantidad;
    const _precio: number = parseFloat(this.productoSeleccionado.precio);
    const _total: number = _cantidad * _precio;
    this.totalPagar = this.totalPagar + _total;

    this.listaProductosParaVenta.push({
      idProducto: this.productoSeleccionado.idProducto,
      descripcionProducto: this.productoSeleccionado.nombre,
      cantidad: _cantidad,
      precioTexto: String(_precio.toFixed(2)),
      totalTexto: String(_total.toFixed(2)),
    });

    this.datosDetalleVenta = new MatTableDataSource(
      this.listaProductosParaVenta
    );

    this.formularioProductoVenta.patchValue({
      producto: '',
      cantidad: '',
    });
  }

  eliminarProducto(detalle: DetalleVenta) {
    this.totalPagar = this.totalPagar - parseFloat(detalle.totalTexto);
    this.listaProductosParaVenta = this.listaProductosParaVenta.filter(
      (p) => p.idProducto != detalle.idProducto
    );
    this.datosDetalleVenta = new MatTableDataSource(
      this.listaProductosParaVenta
    );
  }

  registrarVenta() {
    if (this.listaProductosParaVenta.length > 0) {
      this.bloquearBotonRegistrar = true;

      const request: Venta = {
        tipoPago: this.tipodePagoPorDefecto,
        totalTexto: String(this.totalPagar.toFixed(2)),
        detalleVenta: this.listaProductosParaVenta,
      };

      this._ventaServicio.registrar(request).subscribe({
        next: (response) => {
          if (response.status) {
            this.totalPagar = 0.0;
            this.listaProductosParaVenta = [];
            this.datosDetalleVenta = new MatTableDataSource(
              this.listaProductosParaVenta
            );

            Swal.fire({
              icon: 'success',
              title: 'Venta Registrada!',
              text: `Numero de venta: ${response.value.numeroDocumento}`,
            });
          } else {
            this._utilidadServicio.mostrarAlerta(
              'No se pudo registrar la venta',
              'Oops'
            );
          }
        },
        complete: () => {
          this.bloquearBotonRegistrar = false;
        },
        error: (e) => {},
      });
    }
  }

  compararHistorialYReporte() {
    const fechaInicioInput = this.compararVentasForm.value.fechaInicio;
    const fechaFinInput = this.compararVentasForm.value.fechaFin;

    // Validar que ambas fechas estén presentes
    if (!fechaInicioInput || !fechaFinInput) {
      Swal.fire(
        'Error',
        'Debe seleccionar un rango de fechas para la comparación.',
        'error'
      );
      return;
    }

    // Convertir las fechas a formato 'DD/MM/YYYY' para enviarlas al servicio
    const fechaInicio = moment(fechaInicioInput).format('DD/MM/YYYY');
    const fechaFin = moment(fechaFinInput).format('DD/MM/YYYY');

    // Verificar que las fechas formateadas sean válidas
    if (
      !moment(fechaInicio, 'DD/MM/YYYY', true).isValid() ||
      !moment(fechaFin, 'DD/MM/YYYY', true).isValid()
    ) {
      Swal.fire(
        'Error',
        'El formato de las fechas ingresadas no es válido.',
        'error'
      );
      return;
    }

    // Llamar al servicio para comparar las ventas
  // Llamar al servicio para comparar las ventas
this._ventaServicio
.compararHistorialYReporte(fechaInicio, fechaFin)
.subscribe({
  next: (response) => {
    console.log('Respuesta del servicio:', response.value); // Para depuración

    if (response.status) {
      // Validar y normalizar los datos de la respuesta
      if (response.value && Array.isArray(response.value)) {
        this.resultadosComparacion = response.value; // Es un arreglo
      } else if (response.value) {
        this.resultadosComparacion = [response.value]; // Convierte un único objeto en un arreglo
      } else {
        this.resultadosComparacion = []; // En caso de que no haya datos
      }

      // Construir mensaje con los datos de la comparación
      const detallesComparacion = this.resultadosComparacion
        .map((item: ComparacionVentasDTO) => `
          <b>ID Producto:</b> ${item.idProducto}<br>
          <b>Nombre Producto:</b> ${item.nombreProducto}<br>
          <b>Cantidad Vendida:</b> ${item.cantidadVendida}<br>
          <b>Porcentaje de Venta:</b> ${item.porcentajeVenta}%<br>
          <b>Tipo de Pago:</b> ${item.tipoPago}<br>
          <b>Número de Documento:</b> ${item.numeroDocumento}<br>
          <hr>
        `)
        .join('');

      Swal.fire({
        title: 'Éxito',
        html: `La comparación se realizó correctamente:<br>${detallesComparacion}`,
        icon: 'success',
        width: '600px', // Ajusta el ancho si hay muchos datos
      });
    } else {
      Swal.fire(
        'Error',
        'No se pudo obtener los datos para comparar.',
        'error'
      );
    }
  },
  error: (e) => {
    console.error('Error en la solicitud:', e); // Para depuración
    Swal.fire(
      'Error',
      'Hubo un problema al comparar las ventas.',
      'error'
    );
  },
});


  }
}
