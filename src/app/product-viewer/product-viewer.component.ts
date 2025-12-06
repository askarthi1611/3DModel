import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';

interface MeshPart {
  name: string;
  mesh: THREE.Mesh;
  color: string;
  index: number;
  preview?: string; // base64 image for preview
}

@Component({
  selector: 'app-product-viewer',
  templateUrl: './product-viewer.component.html',
  styleUrls: ['./product-viewer.component.css']
})
export class ProductViewerComponent implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  model!: THREE.Object3D | null;

  modelLoaded = false;
  meshParts: MeshPart[] = [];
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  selectedPart: MeshPart | null = null;

  // default path to the model in assets (you can remove to force upload)
  defaultModelPath = '/assets/models/Front End 3d file.glb';

  constructor() { }

  ngAfterViewInit(): void {
    // If you want to auto-load the model from assets (skip upload), uncomment:
    // this.initScene();
    // this.loadModel(this.defaultModelPath);
  }

  ngAfterViewChecked() {
    // If modelLoaded and canvas exists but scene not initialized
    if (this.modelLoaded && this.canvasRef && !this.renderer) {
      this.initScene();
      this.loadModel(this.defaultModelPath);
    }
  }
  loadDemoModel() {
    this.modelLoaded = true;

    // Wait for Angular to render <div #canvas>
    setTimeout(() => {
      this.initScene();
      this.loadModel(this.defaultModelPath);
    }, 0);
  }

  loadPartsPreviews() {
    // Small delay ensures traversal + bindings fully finish
    setTimeout(() => {
      this.meshParts.forEach((part, i) => {
        setTimeout(() => {
          part.preview = this.generatePartPreview(part.mesh);
        }, i * 80); // spread workload
      });
    }, 50);
  }


  initScene(div?: HTMLElement) {
    const container = div || this.canvasRef.nativeElement;

    // --- existing Three.js setup ---
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
this.controls = new OrbitControls(this.camera, this.renderer.domElement);
this.controls.enableDamping = true;

this.controls.autoRotate = this.autoRotate;
this.controls.autoRotateSpeed = this.autoRotateSpeed;
this.controls.screenSpacePanning = false;

    window.addEventListener('resize', this.onWindowResize.bind(this));

    // --- add mouse click listener here ---
    this.renderer.domElement.addEventListener('click', this.onCanvasClick.bind(this), false);
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

  // Upload button handler
  onUploadModel(ev: any) {
    const file = ev.target.files ? ev.target.files[0] : null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.modelLoaded = true;
    this.initScene();
    this.loadModel(url);
  }

  // Drag & drop support
  onDragOver(e: DragEvent) {
    e.preventDefault();
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      this.modelLoaded = true;
      this.initScene();
      this.loadModel(url);
    }
  }

  loadModel(url: string) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      // remove previous model
      if (this.model) {
        this.scene.remove(this.model);
        this.meshParts = [];
      }
      this.model = gltf.scene;
      this.scene.add(this.model);

      // auto fit to view
      this.fitCameraToObject(this.camera, this.model, 1.2);

      // extract mesh parts
      this.extractMeshParts();
      // this.loadPartsPreviews();
      console.log('this.meshParts::', this.meshParts);
      this.modelLoaded = true;
      this.animate();
    }, (xhr) => {
      // progress
    }, (err) => {
      console.error('Error loading model', err);
      alert('Failed to load model. Check console for details.');
    });
  }

  fitCameraToObject(camera: THREE.Camera, object: THREE.Object3D, offset = 1.25) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size, 0.1);
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxSize / 2 / Math.tan(fov / 2)) * offset;

    camera.position.set(center.x, center.y, center.z + cameraZ);
    (camera as THREE.PerspectiveCamera).near = maxSize / 100;
    (camera as THREE.PerspectiveCamera).far = maxSize * 100;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    if (this.controls) this.controls.target.copy(center);
  }



  updatePartColor(part: MeshPart) {
    if (!part || !part.mesh) return;
    part.mesh.material = new THREE.MeshStandardMaterial({
      color: part.color,
      metalness: 0.2,
      roughness: 0.7
    });
    part.mesh.material.needsUpdate = true;
  }


  // start render loop
animate = () => {
  requestAnimationFrame(this.animate);

  if (this.controls) {
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = this.autoRotateSpeed;
    this.controls.update();
  }

  if (this.renderer && this.camera) {
    this.renderer.render(this.scene, this.camera);
  }
};


  defaultColors: Map<string, string> = new Map();

  extractMeshParts() {
    this.meshParts = [];
    let idx = 0;
    this.model?.traverse((child: any) => {
      if (child.isMesh) {
        const mesh: any = child as THREE.Mesh;
        const name = mesh.name && mesh.name.trim() !== '' ? mesh.name : `part_${idx}`;
        const color = mesh.material?.color ? `#${mesh.material.color.getHexString()}` : '#cccccc';
        let obj: any = { name, mesh, color, index: idx }
        this.meshParts.push(obj);
        this.defaultColors.set(name, color); // save default
        idx++;
      }
    });
  }

  generatePartPreview(mesh: THREE.Mesh | any): string {
    // Offscreen scene
    const previewScene = new THREE.Scene();
    const meshClone = new THREE.Mesh(mesh.geometry, new THREE.MeshStandardMaterial({ color: mesh.material.color }));

    previewScene.add(meshClone);

    // Add simple lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    previewScene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(5, 10, 7);
    previewScene.add(dir);

    // Camera
    const previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    // this.fitCameraToObject(previewCamera, meshClone);

    // Use a single offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    const previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas });
    previewRenderer.setSize(100, 100);
    previewRenderer.render(previewScene, previewCamera);

    const dataUrl = canvas.toDataURL();
    // previewRenderer.dispose(); // free GPU memory

    return dataUrl;
  }

  resetPart(part: MeshPart) {
    const defaultColor = this.defaultColors.get(part.name) || '#cccccc';
    part.color = defaultColor;
    this.updatePartColor(part);
  }

  resetAllParts() {
    this.meshParts.forEach(p => this.resetPart(p));
  }
popupX: number = 0;
popupY: number = 0;

onCanvasClick(event: MouseEvent) {
  if (!this.renderer || !this.camera || !this.model) return;

  const bounds = this.renderer.domElement.getBoundingClientRect();
  this.popupX = event.clientX - bounds.left + 10;
  this.popupY = event.clientY - bounds.top + 10;

  this.mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  this.mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

  this.raycaster.setFromCamera(this.mouse, this.camera);

  const intersects = this.raycaster.intersectObjects(this.model.children, true);

  if (intersects.length > 0) {
    const mesh = intersects[0].object as THREE.Mesh;
    this.selectedPart = this.meshParts.find(p => p.mesh === mesh) || null;
  } else {
    this.selectedPart = null;
  }
}
toggleAutoRotate() {
  this.autoRotate = !this.autoRotate;
}
onRotateToggle() {
  // DO NOT toggle it again
  // autoRotate = !autoRotate ❌ REMOVE

  // Just update OrbitControls
  this.controls.autoRotate = this.autoRotate;
  this.controls.autoRotateSpeed = this.autoRotateSpeed;
}

autoRotate: boolean = false;
autoRotateSpeed: number = 1.0; // default speed

applyColor() {
  if (this.selectedPart) {
    this.updatePartColor(this.selectedPart);
  }

  // Close popup after applying
  this.selectedPart = null;
}

}
