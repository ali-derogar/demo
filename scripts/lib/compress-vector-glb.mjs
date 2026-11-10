/** Draco compression of clothing surfaces, preserving submillimetre detail. */
import { readFile, writeFile } from 'node:fs/promises';
import draco from 'draco3dgltf';
let encoderPromise;
export async function compressGarmentGLB(path) {
  const bytes = await readFile(path), jsonLength = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength)), bin = bytes.subarray(28 + jsonLength);
  if (doc.extensionsRequired?.includes('KHR_draco_mesh_compression')) return;
  const module = await (encoderPromise ??= draco.createEncoderModule({}));
  const constructors = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }, components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  const chunks = [], views = [], counts = []; let length = 0;
  function append(buffer) {
    const pad = (4 - length % 4) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); length += pad; }
    const index = views.length; views.push({ buffer: 0, byteOffset: length, byteLength: buffer.length }); chunks.push(buffer); length += buffer.length; return index;
  }
  function values(index) {
    const accessor = doc.accessors[index], view = doc.bufferViews[accessor.bufferView], Constructor = constructors[accessor.componentType];
    if (view.byteStride) throw new Error('Unexpected strided garment buffer');
    const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0), size = accessor.count * components[accessor.type] * Constructor.BYTES_PER_ELEMENT;
    const data = bin.subarray(offset, offset + size); return new Constructor(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
  }
  for (const mesh of doc.meshes) for (const primitive of mesh.primitives) {
    const input = new module.Mesh(), builder = new module.MeshBuilder(), encoder = new module.Encoder(), output = new module.DracoInt8Array();
    const indices = Uint32Array.from(values(primitive.indices)); builder.AddFacesToMesh(input, indices.length / 3, indices);
    const attributes = {};
    for (const [name, index] of Object.entries(primitive.attributes)) {
      const accessor = doc.accessors[index], type = { POSITION: module.POSITION, NORMAL: module.NORMAL, TEXCOORD_0: module.TEX_COORD, TANGENT: module.GENERIC }[name];
      if (type === undefined) throw new Error('Unexpected garment attribute: ' + name);
      attributes[name] = builder.AddFloatAttributeToMesh(input, type, accessor.count, components[accessor.type], Float32Array.from(values(index)));
    }
    encoder.SetSpeedOptions(4, 4); encoder.SetAttributeQuantization(module.POSITION, 16); encoder.SetAttributeQuantization(module.NORMAL, 12); encoder.SetAttributeQuantization(module.TEX_COORD, 14); encoder.SetAttributeQuantization(module.GENERIC, 12);
    encoder.SetEncodingMethod(module.MESH_EDGEBREAKER_ENCODING); encoder.SetTrackEncodedProperties(true);
    const size = encoder.EncodeMeshToDracoBuffer(input, output); if (size <= 0) throw new Error('Garment Draco encoding failed');
    const compressed = Buffer.alloc(size); for (let i = 0; i < size; i++) compressed[i] = output.GetValue(i);
    primitive.extensions = { ...primitive.extensions, KHR_draco_mesh_compression: { bufferView: append(compressed), attributes } };
    counts.push([primitive.indices, encoder.GetNumberOfEncodedFaces() * 3]);
    for (const index of Object.values(primitive.attributes)) counts.push([index, encoder.GetNumberOfEncodedPoints()]);
    module.destroy(output); module.destroy(encoder); module.destroy(builder); module.destroy(input);
  }
  for (const image of doc.images || []) {
    if (image.bufferView === undefined) continue;
    const view = doc.bufferViews[image.bufferView]; image.bufferView = append(bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength));
  }
  // Accessors describe decoded data; the extension supplies its compressed buffer.
  for (const [index, count] of counts) doc.accessors[index].count = count;
  for (const accessor of doc.accessors) { delete accessor.bufferView; delete accessor.byteOffset; }
  doc.bufferViews = views; doc.buffers = [{ byteLength: length }];
  doc.extensionsUsed = [...new Set([...(doc.extensionsUsed || []), 'KHR_draco_mesh_compression'])];
  doc.extensionsRequired = [...new Set([...(doc.extensionsRequired || []), 'KHR_draco_mesh_compression'])];
  const json = Buffer.from(JSON.stringify(doc)), jsonPad = Buffer.alloc((4 - json.length % 4) % 4, 32), binary = Buffer.concat(chunks), binPad = Buffer.alloc((4 - binary.length % 4) % 4);
  const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + jsonPad.length + binary.length + binPad.length, 8); header.writeUInt32LE(json.length + jsonPad.length, 12); header.write('JSON', 16);
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length + binPad.length); binHeader.writeUInt32LE(0x004e4942, 4);
  const result = Buffer.concat([header, json, jsonPad, binHeader, binary, binPad]); await writeFile(path, result);
  console.log('Garment GLB:', (bytes.length / 1048576).toFixed(1), '→', (result.length / 1048576).toFixed(1), 'MiB');
}
