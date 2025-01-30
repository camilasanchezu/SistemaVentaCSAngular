import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { ModalProductoComponent } from '../../Modales/modal-producto/modal-producto.component';
import { Producto } from 'src/app/Interfaces/producto';
import { ProductoService } from 'src/app/Services/producto.service';
import { UtilidadService } from 'src/app/Reutilizable/utilidad.service';
import Swal from 'sweetalert2';

import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.component.html',
  styleUrls: ['./producto.component.css'],
})
export class ProductoComponent implements OnInit, AfterViewInit {
  columnasTabla: string[] = [
    'nombre',
    'categoria',
    'stock',
    'precio',
    'estado',
    'acciones',
  ];
  dataInicio: Producto[] = [];
  dataListaProductos = new MatTableDataSource(this.dataInicio);
  @ViewChild(MatPaginator) paginacionTabla!: MatPaginator;
  modoOscuro = false; // Estado del modo oscuro
  stockTotal = 0;
  maxStock: number = 1000;
  porcentajeStock: number = 0; // Agrega la propiedad para el porcentaje de stock
  categorias: { nombre: string; cantidad: number; stock: number }[] = []; // Cambiar a array de objetos con propiedades nombre y cantidad



  

  constructor(
    private dialog: MatDialog,
    private _productoServicio: ProductoService,
    private _utilidadServicio: UtilidadService,
    private _snackBar: MatSnackBar // Inyección de MatSnackBar
  ) {}

  obtenerProductos() {
    this._productoServicio.lista().subscribe({
      next: (data) => {
        if (data.status) {
          this.dataListaProductos.data = data.value;
          this.calcularStockTotal();
          this.agruparPorCategoria(); // Agrupar productos por categoría
        } else {
          this._utilidadServicio.mostrarAlerta('No se encontraron datos', 'Oops!');
        }
      },
      error: (e) => {
        this._utilidadServicio.mostrarAlerta('Error al cargar los productos', 'Error');
      },
    });
  }

  ngOnInit(): void {
    this.obtenerProductos();
    this.modoOscuro = localStorage.getItem('modoOscuro') === 'true'; // Cargar estado del modo oscuro
    this.actualizarModoOscuro(); // Actualizar el modo oscuro
  }

  ngAfterViewInit(): void {
    this.dataListaProductos.paginator = this.paginacionTabla;
  }

  calcularStockTotal() {
    this.stockTotal = this.dataListaProductos.data.reduce(
      (total, producto) => total + producto.stock, 0
    );
  
    // Calcula el porcentaje de stock (por ejemplo, suponer que el stock máximo es 1000)
    const stockMaximo = 1000; // Asume un valor máximo para el cálculo de porcentaje
    this.porcentajeStock = (this.stockTotal / stockMaximo) * 100; // Calcula el porcentaje
  }

  agruparPorCategoria() {
    // Agrupamos los productos por categoría y calculamos la suma del stock
    const categorias = this.dataListaProductos.data.reduce((acc, producto) => {
      const categoria = producto.descripcionCategoria; // Nombre de la categoría
      if (!acc[categoria]) {
        acc[categoria] = { cantidad: 0, stock: 0 };
      }
      acc[categoria].cantidad += 1; // Contar productos en la categoría
      acc[categoria].stock += producto.stock; // Sumar el stock de cada producto en la categoría
      return acc;
    }, {} as { [key: string]: { cantidad: number; stock: number } });
  
    // Convertimos el objeto de categorías en un array de categorías con su cantidad y stock total
    this.categorias = Object.keys(categorias).map(categoria => ({
      nombre: categoria,
      cantidad: categorias[categoria].cantidad,
      stock: categorias[categoria].stock,
    }));
  }
  


  aplicarFiltroTabla(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataListaProductos.filter = filterValue.trim().toLocaleLowerCase();
  }

  toggleEstado(producto: Producto) {
    // Cambiar el estado de esActivo
    producto.esActivo = producto.esActivo === 1 ? 0 : 1;

    // Llamar al servicio para actualizar el producto
    this._productoServicio.editar(producto).subscribe({
      next: (data) => {
        if (data.status) {
          this.mostrarNotificacion(
            `Estado de "${producto.nombre}" actualizado`
          );
        } else {
          this.mostrarNotificacion(
            `Error al actualizar el estado de "${producto.nombre}"`
          );
        }
      },
      error: () => this.mostrarNotificacion('Error en la actualización'),
    });
  }

  cambiarModoOscuro() {
    this.modoOscuro = !this.modoOscuro;
    localStorage.setItem('modoOscuro', this.modoOscuro.toString()); // Guardar estado
    this.actualizarModoOscuro();
  }

  actualizarModoOscuro() {
    document.body.classList.toggle('modo-oscuro', this.modoOscuro);
  }

  mostrarNotificacion(mensaje: string) {
    this._snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
  }

  nuevoProducto() {
    this.dialog
      .open(ModalProductoComponent, {
        disableClose: true,
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado === 'true') this.obtenerProductos();
      });
  }

  editarProducto(producto: Producto) {
    this.dialog
      .open(ModalProductoComponent, {
        disableClose: true,
        data: producto,
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado === 'true') this.obtenerProductos();
      });
  }

  eliminarProducto(producto: Producto) {
    Swal.fire({
      title: '¿Desea eliminar el producto?',
      text: producto.nombre,
      icon: 'warning',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      showCancelButton: true,
      cancelButtonColor: '#d33',
      cancelButtonText: 'No, volver',
    }).then((resultado) => {
      if (resultado.isConfirmed) {
        this._productoServicio.eliminar(producto.idProducto).subscribe({
          next: (data) => {
            if (data.status) {
              this._utilidadServicio.mostrarAlerta(
                'El producto fue eliminado',
                'Listo!'
              );
              this.obtenerProductos();
            } else
              this._utilidadServicio.mostrarAlerta(
                'No se pudo eliminar el producto',
                'Error'
              );
          },
          error: (e) => {},
        });
      }
    });
  }
}
