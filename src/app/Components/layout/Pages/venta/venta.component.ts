import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';

import { ProductoService } from 'src/app/Services/producto.service';
import { VentaService } from 'src/app/Services/venta.service';
import { UtilidadService } from 'src/app/Reutilizable/utilidad.service';

import { Producto } from 'src/app/Interfaces/producto';
import { Venta } from 'src/app/Interfaces/venta';
import { DetalleVenta } from 'src/app/Interfaces/detalle-venta';
import { CompararVentasDTO } from 'src/app/Interfaces/comparar-venta';
import { MesesDTO } from 'src/app/Interfaces/meses';
import { CompararVentasResponse } from 'src/app/Interfaces/response-venta';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-venta',
  templateUrl: './venta.component.html',
  styleUrls: ['./venta.component.css']
})
export class VentaComponent implements OnInit {

  listaProductos: Producto[] = [];
  listaProductosFiltro: Producto[] = [];  

  listaProductosParaVenta: DetalleVenta[] = [];
  bloquearBotonRegistrar: boolean = false;

  productoSeleccionado!: Producto;
  tipodePagoPorDefecto: string = "Efectivo";
  totalPagar:  number = 0;

  formularioProductoVenta: FormGroup;
  columnasTabla: string[] = ['producto','cantidad','precio','total','accion'];
  datosDetalleVenta = new MatTableDataSource(this.listaProductosParaVenta);

  // Comparacion Meses
  compararVentasForm: FormGroup;
  resultadosComparacion: CompararVentasDTO[] = [];
  mesesDisponibles = [
    { nombre: 'Enero', valor: 1 },
    { nombre: 'Febrero', valor: 2 },
    { nombre: 'Marzo', valor: 3 },
    { nombre: 'Abril', valor: 4 },
    { nombre: 'Mayo', valor: 5 },
    { nombre: 'Junio', valor: 6 },
    { nombre: 'Julio', valor: 7 },
    { nombre: 'Agosto', valor: 8 },
    { nombre: 'Septiembre', valor: 9 },
    { nombre: 'Octubre', valor: 10 },
    { nombre: 'Noviembre', valor: 11 },
    { nombre: 'Diciembre', valor: 12 }
  ];

  retornarProductosPorFiltro(busqueda: any): Producto[] {
    const valorBuscado = typeof busqueda === "string" ? busqueda.toLocaleLowerCase() : busqueda.nombre.toLocaleLowerCase();

    return this.listaProductos.filter(item => item.nombre.toLocaleLowerCase().includes(valorBuscado));
  }

  constructor(
    private fb: FormBuilder,
    private _productoServicio: ProductoService,
    private _ventaServicio: VentaService,
    private _utilidadServicio: UtilidadService
  ) { 

    this.formularioProductoVenta = this.fb.group({
      producto: ['', Validators.required],
      cantidad: ['', Validators.required]
    });

    // Initialize the form for comparing sales
    this.compararVentasForm = this.fb.group({
      meses: [[], Validators.required]
    });

    this._productoServicio.lista().subscribe({
      next: (data) => {
        if (data.status) {
          const lista = data.value as Producto[];
          this.listaProductos = lista.filter(p => p.esActivo == 1 && p.stock > 0);
        }
      },
      error: (e) => {}
    });

    this.formularioProductoVenta.get('producto')?.valueChanges.subscribe(value => {
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
      idProducto : this.productoSeleccionado.idProducto,
      descripcionProducto : this.productoSeleccionado.nombre,
      cantidad : _cantidad,
      precioTexto: String(_precio.toFixed(2)),
      totalTexto : String(_total.toFixed(2))
    });

    this.datosDetalleVenta = new MatTableDataSource(this.listaProductosParaVenta);

    this.formularioProductoVenta.patchValue({
      producto: '',
      cantidad: ''
    });
  }

  eliminarProducto(detalle: DetalleVenta) {
    this.totalPagar = this.totalPagar - parseFloat(detalle.totalTexto);
    this.listaProductosParaVenta = this.listaProductosParaVenta.filter(p => p.idProducto != detalle.idProducto);

    this.datosDetalleVenta = new MatTableDataSource(this.listaProductosParaVenta);
  }

  registrarVenta() {
    if (this.listaProductosParaVenta.length > 0) {
      this.bloquearBotonRegistrar = true;

      const request: Venta = {
        tipoPago: this.tipodePagoPorDefecto,
        totalTexto: String(this.totalPagar.toFixed(2)),
        detalleVenta: this.listaProductosParaVenta
      };

      this._ventaServicio.registrar(request).subscribe({
        next: (response) => {
          if (response.status) {
            this.totalPagar = 0.00;
            this.listaProductosParaVenta = [];
            this.datosDetalleVenta = new MatTableDataSource(this.listaProductosParaVenta);

            Swal.fire({
              icon: 'success',
              title : 'Venta Registrada!',
              text: `Numero de venta: ${response.value.numeroDocumento}`
            });
          } else {
            this._utilidadServicio.mostrarAlerta("No se pudo registrar la venta", "Oops");
          }
        },
        complete: () => {
          this.bloquearBotonRegistrar = false;
        },
        error: (e) => {}
      });
    }
  }

  // Separating out the compararVentas method outside of registrarVenta
  compararVentas(): void {
    const mesesSeleccionados = this.compararVentasForm.value.meses.map(
        (valor: number) => ({ mes: valor } as MesesDTO)
    );

    this._ventaServicio.compararVentas(mesesSeleccionados).subscribe({
        next: (data: CompararVentasResponse) => {
            if (data.status) {
                if (data.value.length > 0) {
                    this.resultadosComparacion = data.value; // Asignar los resultados
                } else {
                    Swal.fire('Sin datos', 'No se encontraron datos para comparar.', 'warning');
                }
            } else {
                Swal.fire('Error', data.msg || 'No se pudieron comparar las ventas.', 'error');
            }
        },
        error: () => {
            Swal.fire('Error', 'Ocurrió un error al comparar las ventas.', 'error');
        }
    });
}


  
  
}
