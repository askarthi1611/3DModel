# 3D Model Viewer & Customizer

A web application for viewing, interacting with, and customizing 3D models using **Three.js** and **Angular**.

Live Demo: [https://ask3dmodel.onrender.com](https://ask3dmodel.onrender.com)  
GitHub Repository: [https://github.com/askarthi1611/3DModel](https://github.com/askarthi1611/3DModel)

---

## **Features Implemented**

- **✔ Upload any 3D model**  
  Users can upload GLB/GLTF files via choose-file or drag-and-drop.

- **✔ Rotate, zoom, and inspect the model**  
  Full 3D interaction using orbit controls.

- **✔ Click a part and change its color**  
  Raycasting allows users to select any mesh part directly in the 3D view and customize its color with a floating color picker.

- **✔ Use quick-access color tools**  
  Side panel shows all parts with color pickers and instant updates.

- **✔ Reset everything with one click**  
  Resets camera view, auto rotation, and all part colors to default.

- **✔ Enable auto rotation with custom speed**  
  Toggle auto-rotate ON/OFF and adjust rotation speed dynamically.

- **✔ Enjoy a smooth, responsive, modern UI**  
  Clean layout with the 3D viewer on the left and the customization panel on the right.

- **✔ Loader while model is loading**  
  A spinner overlay is displayed while 3D models are being loaded to improve user experience.

---

## **Project Structure**

src/
├─ app/
│ ├─ product-viewer/
│ │ ├─ product-viewer.component.ts
│ │ ├─ product-viewer.component.html
│ │ ├─ product-viewer.component.css
│ └─ ...
└─ assets/
└─ models/ # Default demo 3D model

yaml
Copy code

---

## **Installation & Running Locally**

1. **Clone the repository**
```bash
git clone https://github.com/askarthi1611/3DModel.git
cd 3DModel
Install dependencies

bash
Copy code
npm install
Run the application

bash
Copy code
ng serve
Open your browser at: http://localhost:4200

Usage Instructions
Upload your GLB/GLTF 3D model using the file input or drag-and-drop area.

Use your mouse to rotate, zoom, and pan the model.

Click on any part of the model to open the floating color picker.

Use the sidebar for quick color changes on all parts.

Toggle Auto-Rotate and adjust speed if needed.

Click Reset All to restore camera, rotation, and colors.

Technologies Used
Angular 15+

Three.js

three-stdlib (GLTFLoader, OrbitControls)

Bootstrap 5 for UI

Notes
For complex models, part thumbnails are automatically generated to help identify parts.

Loader overlay ensures users are aware of loading progress.

Author: Karthikeyan S
GitHub: https://github.com/askarthi1611