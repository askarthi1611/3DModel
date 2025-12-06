import { AfterViewInit, Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';

interface MeshPart {
  name: string;
  mesh: THREE.Mesh;
  color: string;
  preview?: string;
}

@Component({
  selector: 'app-product-viewer-parts',
  templateUrl: './product-viewer-parts.component.html',
  styleUrl: './product-viewer-parts.component.css'
})
export class ProductViewerPartsComponent implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  model!: THREE.Object3D;

  modelLoaded = false;
  meshParts: MeshPart[] = [];
  selectedPart: MeshPart | null = null;

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  defaultModelPath = '/assets/models/Front End 3d file.glb';
  defaultColors: Map<string, string> = new Map();

  constructor(private cdRef: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    // Optionally auto-load demo
    // this.loadDemoModel();
  }

  // --- Demo model ---
  loadDemoModel() {
    this.modelLoaded = true;
    this.cdRef.detectChanges(); // ensure canvas div exists
    setTimeout(() => {
      this.initScene();
      this.loadModel(this.defaultModelPath);
    }, 0);
  }

  // --- Scene initialization ---
  initScene() {
    const container = this.canvasRef.nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf7f7fb);

    const rect = container.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight * 0.6;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2, 2, 3);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    this.scene.add(dir);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.screenSpacePanning = false;

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.domElement.addEventListener('click', this.onCanvasClick.bind(this));

    this.animate();
  }

  onWindowResize() {
    if (!this.renderer || !this.camera || !this.canvasRef) return;
    const container = this.canvasRef.nativeElement;
    const rect = container.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight * 0.6;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // --- File upload ---
  onUploadModel(ev: any) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.modelLoaded = true;
    this.cdRef.detectChanges();
    setTimeout(() => {
      this.initScene();
      this.loadModel(url);
    }, 0);
  }

  onDragOver(e: DragEvent) { e.preventDefault(); }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.modelLoaded = true;
    this.cdRef.detectChanges();
    setTimeout(() => {
      this.initScene();
      this.loadModel(url);
    }, 0);
  }

  // --- Load GLTF model ---
  loadModel(url: string) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      if (this.model) this.scene.remove(this.model);

      this.model = gltf.scene;
      this.scene.add(this.model);

      this.fitCameraToObject(this.camera, this.model, 1.2);
      this.extractMeshParts();
    }, undefined, (err) => {
      console.error('Error loading model', err);
      alert('Failed to load model.');
    });
  }

  // --- Animation ---
  animate = () => {
    requestAnimationFrame(this.animate);
    if (this.controls) this.controls.update();
    if (this.renderer && this.camera) this.renderer.render(this.scene, this.camera);
  };

  // --- Mesh color & selection ---
  extractMeshParts() {
    this.meshParts = [];
    let idx = 0;
    this.model.traverse((child: any) => {
      if (child.isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name && mesh.name.trim() !== '' ? mesh.name : `part_${idx}`;
        const color = '#cccccc';
        let obj: any = { name, mesh, color, index: idx }
        obj.preview = this.generatePartPreview(mesh);
        this.meshParts.push(obj);
        console.log('this.meshParts::' , this.meshParts);
        // this.defaultColors.set(name, color); // save default
        // const part: MeshPart = { name, mesh, color };
        // part.preview = this.generatePartPreview(mesh);
        // this.meshParts.push(part);
        idx++;
      }
    });
  }

  updatePartColor(part: MeshPart) {
    if (!part || !part.mesh) return;
    part.mesh.material = new THREE.MeshStandardMaterial({
      color: part.color,
      metalness: 0.2,
      roughness: 0.7
    });
    part.mesh.material.needsUpdate = true;
    part.preview = this.generatePartPreview(part.mesh);
  }

  resetPart(part: MeshPart) {
    const defaultColor = this.defaultColors.get(part.name) || '#cccccc';
    part.color = defaultColor;
    this.updatePartColor(part);
  }

  resetAllParts() {
    this.meshParts.forEach(p => this.resetPart(p));
  }

  onCanvasClick(event: MouseEvent) {
    if (!this.renderer || !this.camera || !this.model) return;
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.model.children, true);
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      this.selectedPart = this.meshParts.find(p => p.mesh === mesh) || null;
      this.meshParts.forEach(p => {
        (p.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(p === this.selectedPart ? 0x333333 : 0x000000);
      });
    } else {
      this.selectedPart = null;
    }
  }

  generatePartPreview(mesh: THREE.Mesh): string {
    const previewScene = new THREE.Scene();
    const meshClone = mesh.clone();
    previewScene.add(meshClone);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    previewScene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(5, 10, 7);
    previewScene.add(dir);

    const previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this.fitCameraToObject(previewCamera, meshClone);

    const previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    previewRenderer.setSize(100, 100);
    previewRenderer.render(previewScene, previewCamera);
    const dataUrl = previewRenderer.domElement.toDataURL();
    previewRenderer.dispose();
    return dataUrl;
  }

  fitCameraToObject(camera: THREE.PerspectiveCamera, object: THREE.Object3D, offset = 1.2) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size, 0.1);
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxSize / 2 / Math.tan(fov / 2)) * offset;

    camera.position.set(center.x, center.y, center.z + cameraZ);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }

}
