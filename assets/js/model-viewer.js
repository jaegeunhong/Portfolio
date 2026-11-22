/* =========================================================
   Interactive 3D viewers (three.js, loaded on demand)
   - Any number of [data-model-viewer] stages on the page
   - Loads .glb (meshopt-compressed) or .stl
   - Buttons inside the same .model-panel: rotate / wire / reset,
     and [data-model-src] buttons that switch between models
   ========================================================= */
const stages = document.querySelectorAll('[data-model-viewer]');

let libsPromise = null;
const loadLibs = () => {
  libsPromise ||= Promise.all([
    import('three'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/loaders/STLLoader.js'),
    import('three/addons/controls/OrbitControls.js'),
    import('three/addons/libs/meshopt_decoder.module.js')
  ]).then(([THREE, { GLTFLoader }, { STLLoader }, { OrbitControls }, { MeshoptDecoder }]) =>
    ({ THREE, GLTFLoader, STLLoader, OrbitControls, MeshoptDecoder }));
  return libsPromise;
};

stages.forEach((stage) => {
  const statusEl = stage.querySelector('[data-model-status]');
  let started = false;

  const start = async () => {
    if (started) return;
    started = true;
    try {
      init(stage, await loadLibs());
    } catch (err) {
      if (statusEl) statusEl.textContent = 'Viewer failed to load';
      console.error(err);
    }
  };

  // Only fetch three.js + the model when the viewer is about to scroll into view
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: '400px 0px' });
    io.observe(stage);
  } else {
    start();
  }
});

function init(stage, { THREE, GLTFLoader, STLLoader, OrbitControls, MeshoptDecoder }) {
  const panel = stage.closest('.model-panel') || stage.parentElement;
  const statusEl = stage.querySelector('[data-model-status]');
  const loadingEl = stage.querySelector('.model-loading');
  const size = () => ({ w: stage.clientWidth, h: stage.clientHeight });
  let { w, h } = size();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 20000);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  stage.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xf2f4f8, 0x15171b, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(1.2, 1.6, 1.4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff6a2b, 2.6);
  rim.position.set(-1.6, 0.6, -1.4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xc9d4ff, 0.35);
  fill.position.set(-1, -0.4, 1.2);
  scene.add(fill);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false; // enabled after the user clicks the viewer, so page scrolling isn't hijacked
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.4;

  // CAD meshes read best flat-shaded (crisp edges, no smoothing across hard corners)
  const material = new THREE.MeshStandardMaterial({ color: 0xaeb4bd, metalness: 0.35, roughness: 0.5, flatShading: true });
  const home = new THREE.Vector3();
  // Default camera direction; a stage can override it with data-view="x,y,z"
  const viewDir = (stage.dataset.view || '1.55,0.8,1.85').split(',').map(Number);
  const cache = new Map();
  let current = null;
  let grid = null;
  let token = 0;

  const gltfLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const stlLoader = new STLLoader();

  const onProgress = (xhr) => {
    if (xhr.lengthComputable && statusEl) statusEl.textContent = `Loading model… ${Math.round(xhr.loaded / xhr.total * 100)}%`;
  };

  // Load a model file and wrap it in a group centred on the origin
  const loadModel = (src) => new Promise((resolve, reject) => {
    if (/\.stl$/i.test(src)) {
      stlLoader.load(src, (geometry) => resolve(new THREE.Mesh(geometry, material)), onProgress, reject);
    } else {
      gltfLoader.load(src, (gltf) => {
        gltf.scene.traverse((o) => { if (o.isMesh) o.material = material; });
        resolve(gltf.scene);
      }, onProgress, reject);
    }
  }).then((obj) => {
    const box = new THREE.Box3().setFromObject(obj);
    obj.position.sub(box.getCenter(new THREE.Vector3()));
    const group = new THREE.Group();
    group.add(obj);
    const sphere = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere());
    group.userData.radius = sphere.radius;
    group.userData.minY = new THREE.Box3().setFromObject(group).min.y;
    return group;
  });

  const frameModel = (group) => {
    const r = group.userData.radius;
    if (grid) { scene.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
    grid = new THREE.GridHelper(r * 4, 28, 0x3a3f48, 0x22262d);
    grid.position.y = group.userData.minY - r * 0.02;
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    scene.add(grid);

    // Distance that fits the whole bounding sphere in the narrower field of view
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const fit = r / Math.sin(Math.min(vFov, hFov) / 2);
    home.set(...viewDir).normalize().multiplyScalar(fit * 0.92);
    camera.position.copy(home);
    camera.near = r / 100;
    camera.far = r * 50;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.minDistance = r * 1.2;
    controls.maxDistance = fit * 2;
    controls.update();
  };

  const show = async (src) => {
    const mine = ++token;
    loadingEl.classList.remove('is-done', 'is-error');
    if (statusEl) statusEl.textContent = 'Loading model…';
    try {
      if (!cache.has(src)) cache.set(src, loadModel(src));
      const group = await cache.get(src);
      if (mine !== token) return; // a newer request won
      if (current) scene.remove(current);
      current = group;
      scene.add(group);
      frameModel(group);
      loadingEl.classList.add('is-done');
    } catch (err) {
      cache.delete(src);
      if (mine !== token) return;
      loadingEl.classList.add('is-error');
      if (statusEl) statusEl.textContent = stage.dataset.missing || 'Model failed to load';
      console.error(err);
    }
  };

  const setPressed = (action, on) => {
    const btn = panel.querySelector(`[data-model-action="${action}"]`);
    if (btn) btn.setAttribute('aria-pressed', String(on));
  };

  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    setPressed('rotate', false);
  });
  renderer.domElement.addEventListener('pointerdown', () => { controls.enableZoom = true; });
  stage.addEventListener('pointerleave', () => { controls.enableZoom = false; });

  panel.querySelectorAll('[data-model-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.modelAction;
      if (action === 'rotate') {
        controls.autoRotate = !controls.autoRotate;
        setPressed('rotate', controls.autoRotate);
      } else if (action === 'wire') {
        material.wireframe = !material.wireframe;
        setPressed('wire', material.wireframe);
      } else if (action === 'reset') {
        camera.position.copy(home);
        controls.target.set(0, 0, 0);
        controls.autoRotate = true;
        setPressed('rotate', true);
        controls.update();
      }
    });
  });

  // Model switcher (e.g. wheel rigid / wheel soft / car)
  const switches = panel.querySelectorAll('[data-model-src]');
  switches.forEach((btn) => {
    btn.addEventListener('click', () => {
      switches.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      show(btn.dataset.modelSrc);
    });
  });

  // Render only while the viewer is on screen
  const frame = () => { controls.update(); renderer.render(scene, camera); };
  new IntersectionObserver((entries) => {
    renderer.setAnimationLoop(entries.some((e) => e.isIntersecting) ? frame : null);
  }).observe(stage);

  new ResizeObserver(() => {
    ({ w, h } = size());
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }).observe(stage);

  show(stage.dataset.src);
}
