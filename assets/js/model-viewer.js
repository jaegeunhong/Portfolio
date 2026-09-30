/* =========================================================
   Interactive STL viewer (three.js, loaded on demand)
   ========================================================= */
const stage = document.querySelector('[data-model-viewer]');

if (stage) {
  const statusEl = stage.querySelector('[data-model-status]');
  const loadingEl = stage.querySelector('.model-loading');
  const buttons = document.querySelectorAll('[data-model-action]');
  let started = false;

  const start = async () => {
    if (started) return;
    started = true;
    try {
      const [THREE, { STLLoader }, { OrbitControls }] = await Promise.all([
        import('three'),
        import('three/addons/loaders/STLLoader.js'),
        import('three/addons/controls/OrbitControls.js')
      ]);
      init(THREE, STLLoader, OrbitControls);
    } catch (err) {
      statusEl.textContent = 'Viewer failed to load';
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

  function init(THREE, STLLoader, OrbitControls) {
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

    const material = new THREE.MeshStandardMaterial({ color: 0xaeb4bd, metalness: 0.35, roughness: 0.5 });
    const home = new THREE.Vector3();

    new STLLoader().load(stage.dataset.src, (geometry) => {
      geometry.computeVertexNormals();
      geometry.center();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const r = geometry.boundingSphere.radius;
      const grid = new THREE.GridHelper(r * 4, 28, 0x3a3f48, 0x22262d);
      grid.position.y = geometry.boundingBox.min.y - r * 0.02;
      grid.material.transparent = true;
      grid.material.opacity = 0.55;
      scene.add(grid);

      // Distance that fits the whole bounding sphere in the narrower field of view
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const fit = r / Math.sin(Math.min(vFov, hFov) / 2);
      home.set(1.55, 0.8, 1.85).normalize().multiplyScalar(fit * 0.92);
      camera.position.copy(home);
      camera.near = r / 100;
      camera.far = r * 50;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.minDistance = r * 1.2;
      controls.maxDistance = fit * 2;
      controls.update();

      loadingEl.classList.add('is-done');
    }, (xhr) => {
      if (xhr.lengthComputable) statusEl.textContent = `Loading model… ${Math.round(xhr.loaded / xhr.total * 100)}%`;
    }, (err) => {
      statusEl.textContent = 'Model failed to load';
      console.error(err);
    });

    const setPressed = (action, on) => {
      const btn = document.querySelector(`[data-model-action="${action}"]`);
      if (btn) btn.setAttribute('aria-pressed', String(on));
    };

    controls.addEventListener('start', () => {
      controls.autoRotate = false;
      setPressed('rotate', false);
    });
    renderer.domElement.addEventListener('pointerdown', () => { controls.enableZoom = true; });
    stage.addEventListener('pointerleave', () => { controls.enableZoom = false; });

    buttons.forEach((btn) => {
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

    // Render only while the viewer is on screen
    const frame = () => { controls.update(); renderer.render(scene, camera); };
    const vis = new IntersectionObserver((entries) => {
      renderer.setAnimationLoop(entries.some((e) => e.isIntersecting) ? frame : null);
    });
    vis.observe(stage);

    new ResizeObserver(() => {
      ({ w, h } = size());
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }).observe(stage);
  }
}
