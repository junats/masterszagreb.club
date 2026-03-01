# Three.js Logo Manipulation Guide

The MASTERS logo is now fully integrated into Three.js as a 3D mesh. You can manipulate it using standard Three.js methods.

## Accessing the Logo

```javascript
// Get the logo mesh
const logoMesh = window.logoAnimator3D.getLogoMesh();

// Get the scene
const scene = window.logoAnimator3D.getScene();

// Get the camera
const camera = window.logoAnimator3D.getCamera();

// Get the renderer
const renderer = window.logoAnimator3D.getRenderer();
```

## Basic Transformations

### Rotation
```javascript
const logo = window.logoAnimator3D.getLogoMesh();

// Rotate on X axis (tilt forward/backward)
logo.rotation.x = Math.PI / 4; // 45 degrees

// Rotate on Y axis (spin left/right)
logo.rotation.y = Math.PI / 2; // 90 degrees

// Rotate on Z axis (roll)
logo.rotation.z = Math.PI / 6; // 30 degrees
```

### Position
```javascript
const logo = window.logoAnimator3D.getLogoMesh();

// Move logo
logo.position.x = 5;  // Move right
logo.position.y = -3; // Move down
logo.position.z = 2;  // Move forward
```

### Scale
```javascript
const logo = window.logoAnimator3D.getLogoMesh();

// Scale uniformly
logo.scale.set(1.5, 1.5, 1.5);

// Scale on specific axes
logo.scale.x = 2;   // Stretch horizontally
logo.scale.y = 0.5; // Squash vertically
```

## Advanced Effects

### Continuous Rotation Animation
```javascript
const logo = window.logoAnimator3D.getLogoMesh();

// Add custom animation
setInterval(() => {
    logo.rotation.y += 0.01;
}, 16);
```

### Wobble Effect
```javascript
const logo = window.logoAnimator3D.getLogoMesh();
let time = 0;

setInterval(() => {
    time += 0.05;
    logo.rotation.x = Math.sin(time) * 0.3;
    logo.rotation.z = Math.cos(time) * 0.2;
}, 16);
```

### Pulsing Scale
```javascript
const logo = window.logoAnimator3D.getLogoMesh();
let time = 0;

setInterval(() => {
    time += 0.05;
    const scale = 1 + Math.sin(time) * 0.2;
    logo.scale.set(scale, scale, 1);
}, 16);
```

## Adding Custom Objects to Scene

### Add a Cube
```javascript
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00ff41,
    wireframe: true 
});
const cube = new THREE.Mesh(geometry, material);
cube.position.set(10, 0, 0);

window.logoAnimator3D.addObject(cube);
```

### Add Particles
```javascript
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(1000 * 3);

for (let i = 0; i < 1000; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
    color: 0xff00ff,
    size: 0.5
});

const particles = new THREE.Points(geometry, material);
window.logoAnimator3D.addObject(particles);
```

## Changing Logo Material

### Make it Glow
```javascript
const logo = window.logoAnimator3D.getLogoMesh();

logo.material = new THREE.MeshBasicMaterial({
    map: logo.material.map, // Keep the texture
    transparent: true,
    emissive: 0x00ff41,
    emissiveIntensity: 0.5
});
```

### Add Wireframe Overlay
```javascript
const logo = window.logoAnimator3D.getLogoMesh();

const wireframeGeo = logo.geometry.clone();
const wireframeMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.3
});

const wireframe = new THREE.Mesh(wireframeGeo, wireframeMat);
logo.add(wireframe);
```

## Camera Manipulation

### Zoom In/Out
```javascript
const camera = window.logoAnimator3D.getCamera();

// Zoom in
camera.position.z = 20;

// Zoom out
camera.position.z = 50;
```

### Orbit Camera
```javascript
const camera = window.logoAnimator3D.getCamera();
let angle = 0;

setInterval(() => {
    angle += 0.01;
    camera.position.x = Math.cos(angle) * 30;
    camera.position.z = Math.sin(angle) * 30;
    camera.lookAt(0, 0, 0);
}, 16);
```

## Post-Processing Effects

### Add Bloom Effect
```javascript
// You'll need to include EffectComposer and BloomPass
// This is just an example structure

const scene = window.logoAnimator3D.getScene();
const camera = window.logoAnimator3D.getCamera();
const renderer = window.logoAnimator3D.getRenderer();

// Create composer
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom
const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(120, 160),
    1.5,  // strength
    0.4,  // radius
    0.85  // threshold
);
composer.addPass(bloomPass);
```

## Useful Console Commands

Try these in the browser console:

```javascript
// Spin the logo
window.logoAnimator3D.getLogoMesh().rotation.y += 1;

// Make it bigger
window.logoAnimator3D.getLogoMesh().scale.set(2, 2, 2);

// Move it around
window.logoAnimator3D.getLogoMesh().position.x = 5;

// Get all scene objects
window.logoAnimator3D.getScene().children;

// Toggle hover state
window.logoAnimator3D.setHovered(true);

// Toggle active state
window.logoAnimator3D.setActive(true);
```

## Tips

1. **Always check if logo is loaded**: The logo loads asynchronously, so check if it exists before manipulating:
   ```javascript
   const logo = window.logoAnimator3D.getLogoMesh();
   if (logo) {
       // Do stuff
   }
   ```

2. **Preserve existing animations**: The built-in animations will continue running. Your custom changes will combine with them.

3. **Performance**: Too many custom animations can slow things down. Use `requestAnimationFrame` for smooth animations.

4. **Debugging**: Use `console.log(window.logoAnimator3D.getScene())` to inspect all objects in the scene.

## Example: Complete Custom Effect

```javascript
// Wait for logo to load
setTimeout(() => {
    const logo = window.logoAnimator3D.getLogoMesh();
    
    if (logo) {
        let time = 0;
        
        function customAnimation() {
            time += 0.02;
            
            // Spiral rotation
            logo.rotation.y = time;
            logo.rotation.x = Math.sin(time) * 0.5;
            
            // Pulsing scale
            const scale = 1 + Math.sin(time * 2) * 0.3;
            logo.scale.set(scale, scale, 1);
            
            // Wave position
            logo.position.y = Math.sin(time * 3) * 2;
            
            requestAnimationFrame(customAnimation);
        }
        
        customAnimation();
    }
}, 2000); // Wait 2 seconds for logo to load
```

Enjoy manipulating your 3D logo! 🎨
