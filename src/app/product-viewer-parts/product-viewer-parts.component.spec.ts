import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductViewerPartsComponent } from './product-viewer-parts.component';

describe('ProductViewerPartsComponent', () => {
  let component: ProductViewerPartsComponent;
  let fixture: ComponentFixture<ProductViewerPartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductViewerPartsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductViewerPartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
