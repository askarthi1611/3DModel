import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductViewerComponent } from './product-viewer/product-viewer.component';
import { ProductViewerPartsComponent } from './product-viewer-parts/product-viewer-parts.component';

const routes: Routes = [
  { path: '', component: ProductViewerComponent },
  { path: 'parts', component: ProductViewerPartsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
