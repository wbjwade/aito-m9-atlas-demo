import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Container conversion only. No downloaded code is imported or executed.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(projectRoot, 'public', 'models', 'aito-m9');
const destination = path.join(projectRoot, 'public', 'models', 'aito-m9.glb');
const source = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'scene.gltf'), 'utf8'));
const document = structuredClone(source);
const align4 = n => (n + 3) & ~3;

function readLocal(uri) {
  if (!uri || /^(?:[a-z]+:|\/|\\)/i.test(uri)) throw new Error('Only relative local resource paths are supported.');
  const fullPath = path.resolve(sourceRoot, decodeURIComponent(uri));
  if (!fullPath.startsWith(sourceRoot + path.sep)) throw new Error('Resource escapes the source directory.');
  return fs.readFileSync(fullPath);
}

if (document.buffers.length !== 1) throw new Error('Expected one source buffer.');
const geometryBytes = readLocal(document.buffers[0].uri);
if (geometryBytes.length !== document.buffers[0].byteLength) throw new Error('Source buffer length mismatch.');
const binaryParts = [geometryBytes, Buffer.alloc(align4(geometryBytes.length) - geometryBytes.length)];
let binaryLength = align4(geometryBytes.length);
for (const image of document.images || []) {
  if (!image.uri) throw new Error('Expected an external source image URI.');
  const bytes = readLocal(image.uri);
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Expected a PNG image.');
  image.bufferView = document.bufferViews.length;
  image.mimeType = 'image/png';
  delete image.uri;
  document.bufferViews.push({ buffer: 0, byteOffset: binaryLength, byteLength: bytes.length });
  binaryParts.push(bytes, Buffer.alloc(align4(bytes.length) - bytes.length));
  binaryLength += align4(bytes.length);
}
document.buffers = [{ byteLength: binaryLength }];
const jsonBytes = Buffer.from(JSON.stringify(document), 'utf8');
const paddedJson = Buffer.alloc(align4(jsonBytes.length), 0x20);
jsonBytes.copy(paddedJson);
const binary = Buffer.concat(binaryParts);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + binary.length, 8);
const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(paddedJson.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(binary.length, 0);
binaryHeader.writeUInt32LE(0x004e4942, 4);
const result = Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, binary]);

// Validate the produced container before the only write, and preserve the source files.
const exportedJsonLength = result.readUInt32LE(12);
const exported = JSON.parse(result.toString('utf8', 20, 20 + exportedJsonLength));
const exportedBinStart = 20 + exportedJsonLength + 8;
const exportedBin = result.subarray(exportedBinStart);
const primitiveCount = data => data.meshes.reduce((sum, mesh) => sum + mesh.primitives.length, 0);
if (JSON.stringify(source.nodes) !== JSON.stringify(exported.nodes)) throw new Error('Node transforms changed.');
if (JSON.stringify(source.meshes) !== JSON.stringify(exported.meshes)) throw new Error('Meshes changed.');
if (JSON.stringify(source.materials) !== JSON.stringify(exported.materials)) throw new Error('Materials changed.');
if (!geometryBytes.equals(exportedBin.subarray(0, geometryBytes.length))) throw new Error('Geometry bytes changed.');
for (let i = 0; i < source.images.length; i++) {
  const view = exported.bufferViews[exported.images[i].bufferView];
  if (!readLocal(source.images[i].uri).equals(exportedBin.subarray(view.byteOffset, view.byteOffset + view.byteLength))) throw new Error('Texture bytes changed.');
}
if (exported.buffers.some(buffer => 'uri' in buffer) || exported.images.some(image => 'uri' in image)) throw new Error('External file references remain.');
if (primitiveCount(source) !== primitiveCount(exported)) throw new Error('Primitive count changed.');
fs.writeFileSync(destination, result, { flag: 'wx' });
console.log(JSON.stringify({
  output: destination,
  bytes: result.length,
  sha256: crypto.createHash('sha256').update(result).digest('hex'),
  meshes: exported.meshes.length,
  primitives: primitiveCount(exported),
  nodes: exported.nodes.length,
  materials: exported.materials.length,
  embeddedImages: exported.images.length,
  sourceGeometryIdentical: true,
  sourceTexturesIdentical: true,
  externalResources: 0,
}, null, 2));
