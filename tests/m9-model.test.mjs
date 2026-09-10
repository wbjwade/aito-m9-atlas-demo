import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { buildM9Parts, WHEEL_PLACEMENTS } from "../src/build-m9.js";
import {
  CATEGORIES,
  allVisible,
  vehicle,
  partKey,
  classifyM9Part,
  labelM9Part,
} from "../src/m9-parts.js";
import { visibleCount } from "../src/model-state.js";

const assetUrl = new URL("../public/models/aito-m9.glb", import.meta.url);
const sourceUrl = new URL("../public/models/aito-m9/", import.meta.url);
const expectedCounts = {
  body: 6,
  glass: 13,
  interior: 15,
  doors: 5,
  frame: 1,
  trim: 2,
  lights: 4,
  wheels: 8,
};
let bytes, document, binary, sourceDocument, source, parts, sourceSnapshot;
const testTextures = [];

function snapshotSource(scene) {
  const snapshot = [];
  scene.traverse((node) => {
    snapshot.push({
      name: node.name,
      transform: node.matrix.toArray(),
      positions: node.isMesh
        ? createHash("sha256")
            .update(Buffer.from(node.geometry.attributes.position.array.buffer))
            .digest("hex")
        : null,
      materials: node.isMesh
        ? (Array.isArray(node.material) ? node.material : [node.material]).map(
            (material) => ({
              uuid: material.uuid,
              color: material.color?.getHex(),
              opacity: material.opacity,
              metalness: material.metalness,
              roughness: material.roughness,
            }),
          )
        : null,
    });
  });
  return snapshot;
}

before(async () => {
  bytes = await readFile(assetUrl);
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  document = JSON.parse(
    bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)),
  );
  binary = bytes.subarray(28 + bytes.readUInt32LE(12));
  sourceDocument = JSON.parse(
    await readFile(new URL("scene.gltf", sourceUrl), "utf8"),
  );

  const loader = new GLTFLoader();
  // Node has no DOM image decoder. This test-only loader plug-in substitutes a
  // texture object, not geometry/material/transform data. Embedded PNG bytes are
  // independently checked below; image appearance remains a browser QA concern.
  loader.register(() => ({
    name: "M9_NODE_TEST_TEXTURE",
    loadTexture(index) {
      assert.equal(index, 0);
      const texture = new THREE.Texture();
      testTextures.push(texture);
      return Promise.resolve(texture);
    },
  }));
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  source = (await loader.parseAsync(buffer, "")).scene;
  source.updateMatrixWorld(true);
  sourceSnapshot = snapshotSource(source);
  parts = buildM9Parts(source);
});

after(() => {
  const geometries = new Set(),
    materials = new Set();
  for (const root of [source, ...(parts || []).map((part) => part.mesh)]) {
    root?.traverse((node) => {
      if (!node.isMesh) return;
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material])
        materials.add(material);
    });
  }
  for (const resource of [...geometries, ...materials, ...testTextures])
    resource.dispose();
});

test("M9 GLB is a complete version 2 container with self-contained assets", () => {
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
  const binaryHeader = 20 + bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(binaryHeader + 4), 0x004e4942);
  assert.equal(bytes.readUInt32LE(binaryHeader), binary.length);
  assert.equal(bytes.length % 4, 0);
  assert.equal(document.buffers.length, 1);
  assert.equal(document.buffers[0].byteLength, binary.length);
  assert.ok(document.buffers.every((buffer) => !("uri" in buffer)));
  assert.equal(document.images.length, 1);
  assert.ok(
    document.images.every(
      (image) => !("uri" in image) && Number.isInteger(image.bufferView),
    ),
  );
  assert.ok(
    !(document.extensionsRequired || []).includes("KHR_draco_mesh_compression"),
  );
});

test("M9 conversion preserves original geometry, material, node and texture bytes", async () => {
  assert.deepEqual(document.nodes, sourceDocument.nodes);
  assert.deepEqual(document.meshes, sourceDocument.meshes);
  assert.deepEqual(document.materials, sourceDocument.materials);
  assert.deepEqual(document.scenes, sourceDocument.scenes);
  const sourceBinary = await readFile(new URL("scene.bin", sourceUrl));
  assert.ok(binary.subarray(0, sourceBinary.length).equals(sourceBinary));
  const image = document.images[0];
  const imageView = document.bufferViews[image.bufferView];
  const embeddedImage = binary.subarray(
    imageView.byteOffset,
    imageView.byteOffset + imageView.byteLength,
  );
  const sourceImage = await readFile(
    new URL(sourceDocument.images[0].uri, sourceUrl),
  );
  assert.equal(image.mimeType, "image/png");
  assert.ok(embeddedImage.equals(sourceImage));
  assert.ok(
    embeddedImage
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  );
  assert.equal(embeddedImage.toString("ascii", 12, 16), "IHDR");
  assert.equal(embeddedImage.readUInt32BE(16), 1024);
  assert.equal(embeddedImage.readUInt32BE(20), 1024);
});

test("M9 source counts and noncommercial attribution remain intact", async () => {
  assert.equal(document.nodes.length, 281);
  assert.equal(document.meshes.length, 230);
  assert.equal(
    document.meshes.reduce((sum, mesh) => sum + mesh.primitives.length, 0),
    230,
  );
  assert.equal(document.materials.length, 72);
  assert.equal(document.animations?.length || 0, 0);
  assert.equal(document.skins?.length || 0, 0);
  assert.match(document.asset.extras.license, /CC-BY-NC-SA-4.0/);
  assert.match(document.asset.extras.author, /MattDoesBlender/);
  assert.deepEqual(document.asset, sourceDocument.asset);
  const license = await readFile(new URL("license.txt", sourceUrl), "utf8");
  assert.match(license, /MattDoesBlender/);
  assert.match(license, /CC-BY-NC-SA-4.0/);
  assert.match(license, /No commercial use/);
  assert.match(license, /1096bd9a49044fd481c61542bded3097/);
  assert.equal(vehicle.modelUrl, "/models/aito-m9.glb");
  assert.equal(vehicle.licenseUrl, "/models/aito-m9/license.txt");
});

test("M9 category and label rules use assemblies, not reused material names", () => {
  assert.equal(CATEGORIES.length, 8);
  assert.equal(new Set(CATEGORIES.map((category) => category.id)).size, 8);
  assert.deepEqual(
    Object.keys(allVisible()).sort(),
    Object.keys(expectedCounts).sort(),
  );
  const firstVisibility = allVisible();
  firstVisibility.wheels = false;
  assert.equal(allVisible().wheels, true);
  assert.equal(partKey("gsraitom9_door_FL"), "door_FL");
  for (const [name, category] of [
    ["gsraitom9_body", "body"],
    ["gsraitom9_dash_screens_glass", "interior"],
    ["gsraitom9_doorpanel_FL", "interior"],
    ["gsraitom9_3rd_seats", "interior"],
    ["gsraitom9_backlight", "glass"],
    ["gsraitom9_headlightglass_L", "glass"],
    ["gsraitom9_headlight_L", "lights"],
    ["gsraitom9_door_FL", "doors"],
    ["gsraitom9_under", "frame"],
    ["gsraitom9_lettering", "trim"],
    ["wheel_RR", "wheels"],
  ])
    assert.equal(classifyM9Part(name), category, name);
  assert.equal(labelM9Part("gsraitom9_backlight"), "后挡风玻璃");
  assert.equal(labelM9Part("gsraitom9_dash_screens_glass"), "显示屏面板");
  assert.equal(labelM9Part("door_FL"), "左前车门");
  assert.equal(labelM9Part("tire_RR"), "右后轮胎");
  assert.equal(labelM9Part("wheel_FR"), "右前轮毂");
});

test("real M9 scene builds 54 selectable assemblies and 235 render mesh instances", () => {
  let sourceGroups = 0,
    sourceMeshes = 0;
  source.traverse((node) => {
    if (node.isMesh) sourceMeshes++;
    else if (/^gsraitom9_/.test(node.name) && !node.name.includes("material"))
      sourceGroups++;
  });
  assert.equal(sourceGroups, 49);
  assert.equal(sourceMeshes, 230);
  assert.equal(parts.length, 54);
  assert.equal(new Set(parts.map((part) => part.id)).size, 54);
  assert.equal(new Set(parts.map((part) => part.name)).size, 54);
  assert.ok(parts.every((part) => part.mesh.isGroup));
  assert.deepEqual(
    parts.reduce((counts, part) => {
      counts[part.category] = (counts[part.category] || 0) + 1;
      return counts;
    }, {}),
    expectedCounts,
  );
  assert.equal(
    parts.reduce((count, part) => count + part.mesh.children.length, 0),
    235,
  );
  assert.ok(!parts.some((part) => part.id === "m9-plate"));
  assert.equal(visibleCount(parts, allVisible()), 54);
  assert.equal(visibleCount(parts, { ...allVisible(), wheels: false }), 46);
  assert.equal(visibleCount(parts, {}), 0);
});

test("part groups retain mesh identity and have finite normalized geometry", () => {
  const allBounds = new THREE.Box3();
  for (const part of parts) {
    assert.ok(
      part.name && CATEGORIES.some((category) => category.id === part.category),
    );
    assert.ok(
      [...part.base.toArray(), ...part.explode.toArray()].every(
        Number.isFinite,
      ),
    );
    assert.ok(part.mesh.position.equals(part.base));
    assert.ok(part.mesh.children.length > 0);
    for (const mesh of part.mesh.children) {
      assert.equal(mesh.userData.partId, part.id);
      assert.equal(mesh.castShadow, true);
      assert.equal(mesh.receiveShadow, true);
      assert.ok(mesh.geometry.attributes.position.array.every(Number.isFinite));
      mesh.geometry.computeBoundingBox();
      assert.ok(!mesh.geometry.boundingBox.isEmpty());
    }
    allBounds.union(new THREE.Box3().setFromObject(part.mesh));
  }
  assert.ok(Math.abs(allBounds.getSize(new THREE.Vector3()).z - 4.8) < 1e-5);
  assert.ok(Math.abs(allBounds.getCenter(new THREE.Vector3()).x) < 1e-5);
  assert.ok(allBounds.min.y > -0.001);
});

test("four wheel pairs preserve template offsets and mirrored placement transforms", () => {
  assert.equal(WHEEL_PLACEMENTS.length, 4);
  assert.deepEqual(
    WHEEL_PLACEMENTS.map((placement) => placement.corner),
    ["FL", "FR", "RL", "RR"],
  );
  const leftFront = WHEEL_PLACEMENTS[0],
    rightFront = WHEEL_PLACEMENTS[1];
  assert.equal(leftFront.rotation, 0);
  assert.equal(rightFront.rotation, Math.PI);
  assert.equal(leftFront.position[0], -rightFront.position[0]);
  assert.equal(leftFront.position[1], rightFront.position[1]);
  assert.equal(leftFront.position[2], rightFront.position[2]);
  const sourceBodyBounds = new THREE.Box3();
  source.traverse((node) => {
    if (
      !node.isMesh &&
      /^gsraitom9_/.test(node.name) &&
      !node.name.includes("material") &&
      !["tire", "wheel", "plate"].includes(partKey(node.name))
    ) {
      sourceBodyBounds.union(new THREE.Box3().setFromObject(node));
    }
  });
  const center = sourceBodyBounds.getCenter(new THREE.Vector3());
  const scale = 4.8 / sourceBodyBounds.getSize(new THREE.Vector3()).z;
  for (const placement of WHEEL_PLACEMENTS) {
    for (const template of ["tire", "wheel"]) {
      const part = parts.find(
        (candidate) => candidate.id === `m9-${template}_${placement.corner}`,
      );
      assert.equal(part.category, "wheels");
      const original = source.getObjectByName(`gsraitom9_${template}`);
      const originalCenter = new THREE.Box3()
        .setFromObject(original)
        .getCenter(new THREE.Vector3());
      const expectedCenter = originalCenter
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), placement.rotation)
        .add(new THREE.Vector3(...placement.position))
        .sub(new THREE.Vector3(center.x, 0, center.z))
        .multiplyScalar(scale);
      assert.ok(part.base.distanceTo(expectedCenter) < 1e-5, part.id);
      assert.equal(
        Math.sign(part.base.x),
        placement.corner.endsWith("L") ? 1 : -1,
      );
      assert.equal(
        Math.sign(part.base.z),
        placement.corner.startsWith("F") ? 1 : -1,
      );
      assert.equal(Math.sign(part.explode.x), Math.sign(part.base.x));
    }
  }
});

test("runtime material tuning and wheel instancing do not mutate the source scene", () => {
  assert.deepEqual(snapshotSource(source), sourceSnapshot);
  const sourceGeometries = new Set(),
    sourceMaterials = new Set();
  source.traverse((node) => {
    if (!node.isMesh) return;
    sourceGeometries.add(node.geometry);
    for (const material of Array.isArray(node.material)
      ? node.material
      : [node.material])
      sourceMaterials.add(material);
  });
  for (const part of parts)
    for (const mesh of part.mesh.children) {
      assert.ok(!sourceGeometries.has(mesh.geometry));
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]) {
        assert.ok(!sourceMaterials.has(material));
        assert.ok(material.userData.originalEmissive?.isColor);
        assert.equal(
          material.userData.originalEmissiveIntensity,
          material.emissiveIntensity,
        );
      }
    }
});

test("an unrelated or empty model fails with the M9-specific user-facing error", () => {
  assert.throws(
    () => buildM9Parts(new THREE.Group()),
    /M9 模型未包含可显示的部件/,
  );
});
