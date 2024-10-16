import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/guards/auth.guard';

import { LayoutComponent } from './layout.component';
import { DashBoardComponent } from './Pages/dash-board/dash-board.component';
import { HistorialVentaComponent } from './Pages/historial-venta/historial-venta.component';
import { ProductoComponent } from './Pages/producto/producto.component';
import { ReporteComponent } from './Pages/reporte/reporte.component';
import { UsuarioComponent } from './Pages/usuario/usuario.component';
import { VentaComponent } from './Pages/venta/venta.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashBoardComponent,
        //canActivate: [AuthGuard],
      },
      {
        path: 'usuarios',
        component: UsuarioComponent,
        //canActivate: [AuthGuard],
      },
      {
        path: 'productos',
        component: ProductoComponent,
        //canActivate: [AuthGuard],
      },
      {
        path: 'venta',
        component: VentaComponent, //canActivate: [AuthGuard]
      },
      {
        path: 'historial_venta',
        component: HistorialVentaComponent,
        //canActivate: [AuthGuard],
      },
      {
        path: 'reportes',
        component: ReporteComponent,
        //canActivate: [AuthGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
