import * as THREE from "three";
import { classifyM9Part, labelM9Part, partKey } from "./m9-parts.js";

// The supplied asset contains wheel templates at the origin, not four installed wheels.
// These placements are visual assembly estimates, not engineering measurements.
export const WHEEL_PLACEMENTS = [
  { corner: "FL", position: [0.83, 0.366, 1.42], rotation: 0 },
  { corner: "FR", position: [-0.83, 0.366, 1.42], rotation: Math.PI },
  { corner: "RL", position: [0.83, 0.366, -1.47], rotation: 0 },
  { corner: "RR", position: [-0.83, 0.366, -1.47], rotation: Math.PI },
];
export function buildM9Parts(source) {
  source.updateMatrixWorld(true);
  const assemblies = [];
  source.traverse((node) => {
    if (
      /^gsraitom9_/.test(node.name) &&
      !node.isMesh &&
      !node.name.includes("material")
    )
      assemblies.push(node);
  });
  const bodyBounds = new THREE.Box3();
  for (const node of assemblies)
    if (!["tire", "wheel", "plate"].includes(partKey(node.name)))
      bodyBounds.union(new THREE.Box3().setFromObject(node));
  const center = bodyBounds.getCenter(new THREE.Vector3());
  const scale = 4.8 / bodyBounds.getSize(new THREE.Vector3()).z;
  const parts = [];
  function addAssembly(node, key, wheelPlacement) {
    const meshes = [],
      bounds = new THREE.Box3();
    const wheelMatrix = wheelPlacement
      ? new THREE.Matrix4().compose(
          new THREE.Vector3(...wheelPlacement.position),
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            wheelPlacement.rotation,
          ),
          new THREE.Vector3(1, 1, 1),
        )
      : null;
    node.traverse((original) => {
      if (!original.isMesh) return;
      const geometry = original.geometry
        .clone()
        .applyMatrix4(original.matrixWorld);
      if (wheelMatrix) geometry.applyMatrix4(wheelMatrix);
      geometry.translate(-center.x, 0, -center.z).scale(scale, scale, scale);
      geometry.computeBoundingBox();
      bounds.union(geometry.boundingBox);
      const materials = (
        Array.isArray(original.material)
          ? original.material
          : [original.material]
      ).map((sourceMaterial) => {
        const material = sourceMaterial.clone();
        if (material.name === "gsraitom9") {
          material.color.set("#26313a");
          material.metalness = 0.65;
          material.roughness = 0.28;
        }
        if (material.name === "gsraitom9_secondary") {
          material.color.set("#aeb4b8");
          material.metalness = 0.7;
          material.roughness = 0.3;
        }
        if (material.name === "gsraitom9_tire") {
          material.color.set("#202426");
          material.metalness = 0;
          material.roughness = 0.95;
        }
        if (material.name === "gsraitom9_wheel") {
          material.color.set("#a9afb3");
          material.metalness = 0.85;
          material.roughness = 0.25;
        }
        if (
          material.name === "gsraitom9_chrome" ||
          material.name === "gsraitom9_silver"
        ) {
          material.color.set("#adb7bc");
          material.metalness = 0.9;
          material.roughness = 0.22;
        }
        if (/^gsraitom9_(darkglass|glass)$/.test(material.name)) {
          material.color.set("#28343d");
          material.opacity = material.name.includes("darkglass") ? 0.86 : 0.72;
          material.metalness = 0.25;
          material.roughness = 0.12;
          material.depthWrite = false;
        }
        if (material.name === "gsraitom9_clearglass") {
          material.opacity = 0.18;
          material.roughness = 0.12;
          material.depthWrite = false;
        }
        material.envMapIntensity = 1;
        material.userData.originalEmissive = material.emissive?.clone();
        material.userData.originalEmissiveIntensity =
          material.emissiveIntensity;
        return material;
      });
      const mesh = new THREE.Mesh(
        geometry,
        Array.isArray(original.material) ? materials : materials[0],
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes.push(mesh);
    });
    if (!meshes.length) return;
    const base = bounds.getCenter(new THREE.Vector3()),
      group = new THREE.Group();
    const category = classifyM9Part(key),
      id = `m9-${key}`;
    for (const mesh of meshes) {
      mesh.geometry.translate(-base.x, -base.y, -base.z);
      mesh.userData.partId = id;
      group.add(mesh);
    }
    group.position.copy(base);
    const explode = new THREE.Vector3(
      base.x * 0.85,
      (base.y - 0.35) * 0.6,
      base.z * 0.45,
    );
    if (category === "wheels")
      explode.set(Math.sign(base.x) * 0.95, 0.03, Math.sign(base.z) * 0.15);
    if (category === "glass") explode.y += 0.4;
    if (category === "interior") explode.y += 0.35;
    if (key === "hood") explode.y += 0.6;
    if (category === "frame") explode.set(0, -0.13, 0);
    parts.push({
      id,
      name: labelM9Part(key),
      category,
      sourceName: node.name,
      mesh: group,
      base,
      explode,
    });
  }
  for (const node of assemblies) {
    const key = partKey(node.name);
    if (key === "plate") continue; // Unpositioned template; do not fabricate a registration plate.
    if (key === "tire" || key === "wheel") {
      for (const placement of WHEEL_PLACEMENTS)
        addAssembly(node, `${key}_${placement.corner}`, placement);
    } else addAssembly(node, key);
  }
  if (!parts.length) throw new Error("M9 模型未包含可显示的部件。");
  return parts;
}
