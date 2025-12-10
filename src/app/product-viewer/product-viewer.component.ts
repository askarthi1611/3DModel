import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';
import { GLTFExporter } from 'three-stdlib';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
declare var bootstrap: any;

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
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLDivElement> | any;
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
  faqs = [
    {
      question: 'Which 3D formats are supported?',
      answer: 'You can upload .glb and .gltf files. Other formats are not currently supported.',
      icon: 'fas fa-file'
    },
    {
      question: 'Do I need an account to use the 3D Viewer?',
      answer: 'No account is required. The tool is completely free and ready to use.',
      icon: 'fas fa-user-check'
    },
    {
      question: 'Can I customize colors of individual parts?',
      answer: 'Yes! You can click on any part of the model and change its color in real-time.',
      icon: 'fas fa-palette'
    },
    {
      question: 'Can I download my customized model?',
      answer: 'Absolutely. You can export your final model in GLB format with all the color changes applied.',
      icon: 'fas fa-download'
    },
    {
      question: 'Is this tool free forever?',
      answer: 'Yes, it is 100% free with no subscriptions or hidden fees.',
      icon: 'fas fa-gift'
    },
    {
      question: 'How fast is the real-time preview?',
      answer: 'The preview updates instantly when you change colors or rotate the model, with no page reload.',
      icon: 'fas fa-bolt'
    },
    {
      question: 'Does it work on mobile devices?',
      answer: 'Yes, the 3D Viewer is fully responsive and works on tablets and smartphones.',
      icon: 'fas fa-mobile-alt'
    },
    {
      question: 'Can I rotate the model automatically?',
      answer: 'Yes! You can enable the auto-rotate feature to showcase your product from all angles.',
      icon: 'fas fa-sync-alt'
    },
    {
      question: 'Are my uploaded files stored on your server?',
      answer: 'No. All uploads are processed locally in your browser, ensuring privacy and security.',
      icon: 'fas fa-shield-alt'
    },
  ];
  feat: any = [
    { icon: 'fas fa-puzzle-piece', title: 'Auto Part Detection', txt: 'Model is analyzed and parts are shown instantly.' },
    { icon: 'fas fa-palette', title: 'Color Customization', txt: 'Edit colors individually or in grouped categories.' },
    { icon: 'fas fa-bolt', title: 'Real-Time Updates', txt: 'Everything updates live — no reload needed.' },
    { icon: 'fas fa-sync-alt', title: 'Auto Rotate', txt: 'Smooth auto-rotation for product display.' },
    { icon: 'fas fa-save', title: 'Export to GLB', txt: 'Your final model is saved with all your chosen colors.' },
    { icon: 'fas fa-gift', title: '100% Free', txt: 'No signup. No subscriptions. Completely free forever.' }
  ];
  steps = [
    {
      icon: 'fas fa-upload',
      title: '1. Upload',
      description: 'Import any GLB/GLTF model. Drag & drop or choose a file.'
    },
    {
      icon: 'fas fa-paint-roller',
      title: '2. Customize',
      description: 'Click any part of the model or use the color tools.'
    },
    {
      icon: 'fas fa-download',
      title: '3. Export',
      description: 'Download your custom-colored GLB. You can even name the file using our auto-prompt.'
    }
  ];


  // default path to the model in assets (you can remove to force upload)
  defaultModelPath = '/assets/models/Front End 3d file.glb';
  isLoading: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: any) { }
  mobileNavOpen = false;
  isScrolled = false;

  toggleMobileNav() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.mobileNavOpen = !this.mobileNavOpen;
  }


  closeMobileNav() {
    this.mobileNavOpen = false;
  }
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', () => {
        this.isScrolled = window.scrollY > 50;
      });
    }
  }

  ngAfterViewInit(): void {
    // If you want to auto-load the model from assets (skip upload), uncomment:
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
          // Scroll to the section smoothly
          window.location.hash = '#uploadSection';
          uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach((el: any) => {
          new bootstrap.Tooltip(el);
        });
      }, 100);
    }
    // this.initScene();
    // this.loadModel(this.defaultModelPath);

    if (!isPlatformBrowser(this.platformId)) return;

  }

  ngAfterViewChecked() {
    // If modelLoaded and canvas exists but scene not initialized
    // if (this.modelLoaded && this.canvasRef && !this.renderer) {
    //   this.initScene();
    //   this.loadModel(this.defaultModelPath);
    // }
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

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf7f7fb);

    const rect = container.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight * 0.6;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2, 2, 3);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

    window.addEventListener('resize', this.onWindowResize.bind(this));

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
    this.isLoading = true;

    const url = URL.createObjectURL(file);
    this.modelLoaded = true;

    setTimeout(() => {
      this.initScene();
      this.loadModel(url);
    }, 1000);
  }

  // Drag & drop support
  onDragOver(e: DragEvent) {
    e.preventDefault();
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    this.isLoading = true;

    const url = URL.createObjectURL(file);
    this.modelLoaded = true;

    setTimeout(() => {
      this.initScene();
      this.loadModel(url);
    }, 1000);
  }

  loadModel(url: string) {
    // Show loader
    this.isLoading = true;

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
      this.modelLoaded = true;
      this.animate();
      this.isLoading = false;

    }, (xhr) => {
      // progress
    }, (err) => {
      this.isLoading = false;
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



  updatePartColor1(part: MeshPart) {
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
        const mesh: THREE.Mesh | any = child;
        const name = mesh.name && mesh.name.trim() !== '' ? mesh.name : `part_${idx}`;
        const color = mesh.material?.color ? `#${mesh.material.color.getHexString()}` : '#cccccc';

        // Create MeshPart object
        const obj: MeshPart = { name, mesh, color, index: idx };

        // Add to array first
        this.meshParts.push(obj);

        // Save default color
        this.defaultColors.set(name, color);

        idx++;
      }
    });

    // ✅ Apply material colors after all parts are in meshParts
    this.meshParts.forEach(part => this.updatePartColor(part));

    // Refresh color groups once
    this.refreshColorGroups();
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
  resetAll() {

    // 1️⃣ Reset Camera & Controls
    if (this.controls) {
      this.controls.reset();       // resets zoom, rotate, pan
      this.controls.update();
    }

    if (this.camera && this.model) {
      // refit camera to model
      this.fitCameraToObject(this.camera, this.model, 1.2);
    }

    // 2️⃣ Reset Auto Rotation
    this.autoRotate = false;
    this.autoRotateSpeed = 1.0;
    if (this.controls) {
      this.controls.autoRotate = false;
    }

    // 3️⃣ Reset Colors for all parts
    this.meshParts.forEach((part: any) => {
      const defaultColor = this.defaultColors.get(part.name) || '#cccccc';
      part.color = defaultColor;

      if (part.mesh?.material) {
        part.mesh.material.color.set(defaultColor);
        part.mesh.material.needsUpdate = true;
      }
    });

    // 4️⃣ Clear selected popup
    this.selectedPart = null;

    console.log("🔄 All settings have been reset.");
  }

  async downloadModel() {
    if (!this.meshParts || this.meshParts.length === 0) {
      console.error("No mesh parts to export.");
      return;
    }

    const exporter = new GLTFExporter();
    const exportScene = new THREE.Scene();

    // Build a clean scene with only the meshes
    this.meshParts.forEach(part => {
      const src = part.mesh;
      if (!src || !src.geometry) return;

      const geo = src.geometry.clone();

      // Convert UI hex (#ff00aa) → THREE.Color
      const exportColor = new THREE.Color(part.color);

      const cloneSafe = (m: any) => {
        const mat = new THREE.MeshStandardMaterial();

        // 🔥 FINAL COLOR = USER-SELECTED COLOR
        mat.color.copy(exportColor);

        // Preserve PBR roughness + metalness
        mat.metalness = m.metalness ?? 0.2;
        mat.roughness = m.roughness ?? 0.7;

        // Preserve transparency
        mat.transparent = m.transparent ?? false;
        mat.opacity = m.opacity ?? 1;

        // Preserve textures
        mat.map = m.map || null;
        mat.normalMap = m.normalMap || null;
        mat.roughnessMap = m.roughnessMap || null;
        mat.metalnessMap = m.metalnessMap || null;
        mat.aoMap = m.aoMap || null;

        return mat;
      };

      const mat = Array.isArray(src.material)
        ? src.material.map((m: any) => cloneSafe(m))
        : cloneSafe(src.material);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = part.name;

      // Apply world transform
      src.updateWorldMatrix(true, false);
      mesh.applyMatrix4(src.matrixWorld);

      exportScene.add(mesh);
    });



    // Wrap GLTFExporter.parse in a Promise
    const gltfBlob = await new Promise<Blob>((resolve, reject) => {
      exporter.parse(
        exportScene,
        (result) => {
          const blob =
            result instanceof ArrayBuffer
              ? new Blob([result], { type: "model/gltf-binary" })
              : new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
          resolve(blob);
        },
        (error) => reject(error),
        { binary: true }
      );
    });

    // Trigger download
    const url = URL.createObjectURL(gltfBlob);
    const link = document.createElement('a');
    link.href = url;
    let promtname = prompt("Enter file name", "custom_model");
    if (promtname && promtname.trim() !== '') {
      link.download = promtname.trim() + '.glb';
    } else {
      link.download = 'custom_model.glb';
    }
    link.click();
    URL.revokeObjectURL(url);
  }



  activeTab: string = 'parts';
  changeactiveTab(tab: string) {
    this.activeTab = tab;
    console.log('this.activeTab::', this.activeTab);
    console.log('this.meshParts::', this.meshParts);
    console.log('this.this.colorGroups::', this.colorGroups);
  }
  colorGroups: { value: string; parts: MeshPart[] }[] = [];

  /* Create real-time color groups */
  refreshColorGroups() {
    const map = new Map<string, MeshPart[]>();

    this.meshParts.forEach(part => {
      if (!map.has(part.color)) map.set(part.color, []);
      map.get(part.color)!.push(part);
    });

    this.colorGroups = Array.from(map, ([value, parts]) => ({ value, parts }));
  }

  /* Update individual part color */
  updatePartColor(part: MeshPart) {
    this.applyMaterialColor(part.mesh, part.color);
    this.refreshColorGroups();
  }

  /* Change color for entire group */
  updateColorGroup(oldColor: string, newColor: any) {
    this.meshParts.forEach(part => {
      if (part.color === oldColor) {
        part.color = newColor.target.value;
        this.applyMaterialColor(part.mesh, newColor.target.value);
      }
    });

    this.refreshColorGroups();
  }

  /* Apply color to Mesh — supports:
     ✔ single material
     ✔ material arrays
     ✔ textured meshes */
  applyMaterialColor(mesh: THREE.Mesh, color: string) {
    if (!mesh) return;

    const applyToMaterial = (mat: THREE.Material) => {
      if (!mat) return;

      if ((mat as any).color) {
        (mat as any).color.set(color);
      }

      if ((mat as any).map) {
        mat.needsUpdate = true;
      }
    };

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(m => applyToMaterial(m));
    } else {
      applyToMaterial(mesh.material);
    }
  }

  openUrl(url: string) {
    if (isPlatformBrowser(this.platformId)) {
      window.open(url, '_blank');
    }
  }

}
