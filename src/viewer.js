import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { clampExpansion } from "./model-state.js";
import { allVisible, vehicle } from "./m9-parts.js";
import { buildM9Parts } from "./build-m9.js";

export async function createViewer(host, callbacks, signal) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    throw new Error(
      "当前浏览器无法启用 3D 显示。请尝试新版 Edge 或 Chrome，并开启硬件加速。",
    );
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute(
    "aria-label",
    `${vehicle.name}三维模型。拖动旋转，滚轮缩放，也可使用右侧视角按钮。`,
  );
  renderer.domElement.tabIndex = 0;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 4.5;
  controls.maxDistance = 16;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotateSpeed = 0.7;
  const envGenerator = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = envGenerator.fromScene(room, 0.04);
  scene.environment = env.texture;
  room.dispose();
  envGenerator.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x707d83, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 3.4);
  sun.position.set(-3, 7, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -6,
    right: 6,
    top: 6,
    bottom: -6,
    near: 0.1,
    far: 20,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 4;
  scene.add(sun);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.08 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.035;
  ground.receiveShadow = true;
  scene.add(ground);
  const model = new THREE.Group();
  scene.add(model);
  const parts = [];
  let selected = null,
    visibility = allVisible(),
    expansion = 0,
    currentExpansion = 0;
  let frame = 0,
    disposed = false,
    lastTime = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let pointerStart = [0, 0];
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  function setView(view = "perspective") {
    const positions = {
      perspective: [4.4, 3.1, 4.7],
      front: [0, 1.8, 8],
      side: [8, 2, 0],
      top: [0.01, 10, 0],
    };
    camera.position.set(...(positions[view] || positions.perspective));
    controls.target.set(0, 0.82, 0);
    controls.update();
  }
  setView();
  function select(id) {
    selected = parts.find((p) => p.id === id && visibility[p.category]) || null;
    for (const p of parts) {
      p.mesh.traverse((child) => {
        if (!child.material) return;
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((m) => {
          if (!m.emissive) return;
          if (selected?.id === p.id) {
            m.emissive.set(0x315766);
            m.emissiveIntensity = 0.35;
          } else {
            m.emissive.copy(m.userData.originalEmissive);
            m.emissiveIntensity = m.userData.originalEmissiveIntensity;
          }
        });
      });
    }
    callbacks.onSelect(
      selected
        ? {
            id: selected.id,
            name: selected.name,
            category: selected.category,
            sourceName: selected.sourceName,
          }
        : null,
    );
  }
  function pick(event, hover = false) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const found = raycaster.intersectObjects(
      parts.filter((p) => p.mesh.visible).map((p) => p.mesh),
      true,
    )[0];
    if (hover) renderer.domElement.style.cursor = found ? "pointer" : "grab";
    else select(found?.object.userData.partId || null);
  }
  const onDown = (e) => {
    pointerStart = [e.clientX, e.clientY];
  };
  const onUp = (e) => {
    if (
      Math.hypot(e.clientX - pointerStart[0], e.clientY - pointerStart[1]) < 5
    )
      pick(e);
  };
  const onMove = (e) => {
    if (!e.buttons) pick(e, true);
  };
  function rotate(direction) {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      (direction * Math.PI) / 12,
    );
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }
  function zoom(factor) {
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(
      THREE.MathUtils.clamp(
        offset.length() * factor,
        controls.minDistance,
        controls.maxDistance,
      ),
    );
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }
  const onKey = (e) => {
    if (e.isComposing) return;
    if (["ArrowLeft", "ArrowRight", "+", "=", "-", "Escape"].includes(e.key))
      e.preventDefault();
    if (e.key === "ArrowLeft") rotate(-1);
    if (e.key === "ArrowRight") rotate(1);
    if (e.key === "+" || e.key === "=") zoom(0.9);
    if (e.key === "-") zoom(1.1);
    if (e.key === "Escape") select(null);
  };
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("keydown", onKey);
  function tick(time) {
    if (disposed) return;
    const dt = Math.min((time - lastTime) / 1000 || 0.016, 0.05);
    lastTime = time;
    currentExpansion = reduced.matches
      ? expansion
      : THREE.MathUtils.damp(currentExpansion, expansion, 9, dt);
    for (const p of parts)
      p.mesh.position
        .copy(p.base)
        .addScaledVector(p.explode, currentExpansion / 100);
    const fov =
      34 + Math.max(0, 1.2 / camera.aspect - 1) * 22 + currentExpansion * 0.22;
    if (Math.abs(camera.fov - fov) > 0.005) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    controls.update(dt);
    renderer.render(scene, camera);
    if (selected && selected.mesh.visible) {
      const pos = selected.mesh.position.clone().project(camera);
      callbacks.onLabel({
        x: (pos.x * 0.5 + 0.5) * host.clientWidth,
        y: (-pos.y * 0.5 + 0.5) * host.clientHeight,
        visible: pos.z < 1 && Math.abs(pos.x) < 0.95 && Math.abs(pos.y) < 0.9,
      });
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  const loader = new GLTFLoader();
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    controls.dispose();
    renderer.domElement.removeEventListener("pointerdown", onDown);
    renderer.domElement.removeEventListener("pointerup", onUp);
    renderer.domElement.removeEventListener("pointermove", onMove);
    renderer.domElement.removeEventListener("keydown", onKey);
    const textures = new Set();
    scene.traverse((o) => {
      o.geometry?.dispose();
      if (o.material)
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          for (const value of Object.values(m))
            if (value?.isTexture) textures.add(value);
          m.dispose();
        }
    });
    textures.forEach((texture) => texture.dispose());
    env.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }
  signal.addEventListener("abort", dispose, { once: true });
  try {
    const response = await fetch(vehicle.modelUrl, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(25000)]),
    });
    if (!response.ok) throw new Error("模型文件加载失败，请点击重试。");
    const buffer = await response.arrayBuffer();
    const gltf = await loader.parseAsync(buffer, "/models/");
    if (disposed || signal.aborted) {
      gltf.scene.traverse((o) => o.geometry?.dispose());
      return null;
    }
    parts.push(...buildM9Parts(gltf.scene));
    parts.forEach((part) => model.add(part.mesh));
    gltf.scene.traverse((original) => {
      original.geometry?.dispose();
      if (original.material)
        for (const material of Array.isArray(original.material)
          ? original.material
          : [original.material])
          material.dispose();
    });
    callbacks.onReady(parts.map(({ mesh, base, explode, ...p }) => p));
    return {
      dispose,
      select,
      zoom,
      rotate,
      setView,
      setExpansion(value) {
        expansion = clampExpansion(value);
      },
      setVisibility(next) {
        visibility = next;
        parts.forEach((p) => {
          p.mesh.visible = !!visibility[p.category];
        });
        if (selected && !visibility[selected.category]) select(null);
      },
      setAutoRotate(value) {
        controls.autoRotate = value;
      },
      reset() {
        expansion = 0;
        currentExpansion = 0;
        controls.autoRotate = false;
        setView();
        select(null);
      },
    };
  } catch (error) {
    dispose();
    if (!signal.aborted) throw error;
    return null;
  }
}
