/** Read the actual reference GLBs in Node for asset checks and deterministic asset previews. */
import { readFile } from 'node:fs/promises';
import draco from 'draco3dgltf';
import { BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, Matrix4 } from 'three';
let modulePromise;
export async function decodeReference(file) {
  const data = await readFile(file), jsonLength = data.readUInt32LE(12);
  if (data.toString('utf8', 0, 4) !== 'glTF') throw new Error('Invalid GLB: ' + file);
  const doc = JSON.parse(data.toString('utf8', 20, 20 + jsonLength)), bin = data.subarray(28 + jsonLength);
  const decoderModule = await (modulePromise ??= draco.createDecoderModule({}));
  const geometries = new Map();
  for (const [index, definition] of doc.meshes.entries()) {
    const primitive = definition.primitives[0], compressed = primitive.extensions?.KHR_draco_mesh_compression;
    if (!compressed) throw new Error('Expected Draco geometry');
    const view = doc.bufferViews[compressed.bufferView], bytes = bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    const buffer = new decoderModule.DecoderBuffer(); buffer.Init(new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength), bytes.byteLength);
    const decoder = new decoderModule.Decoder(), mesh = new decoderModule.Mesh();
    const status = decoder.DecodeBufferToMesh(buffer, mesh); if (!status.ok()) throw new Error(status.error_msg());
    const geometry = new BufferGeometry();
    for (const [name, uniqueId] of Object.entries(compressed.attributes)) {
      const attribute = decoder.GetAttributeByUniqueId(mesh, uniqueId), values = new decoderModule.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(mesh, attribute, values);
      const array = new Float32Array(mesh.num_points() * attribute.num_components());
      for (let i = 0; i < array.length; i++) array[i] = values.GetValue(i);
      const key = { POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv' }[name];
      if (key) geometry.setAttribute(key, new Float32BufferAttribute(array, attribute.num_components()));
      decoderModule.destroy(values);
    }
    const face = new decoderModule.DracoInt32Array(), indices = new Uint32Array(mesh.num_faces() * 3);
    for (let i = 0; i < mesh.num_faces(); i++) { decoder.GetFaceFromMesh(mesh, i, face); for (let n = 0; n < 3; n++) indices[i * 3 + n] = face.GetValue(n); }
    geometry.setIndex(Array.from(indices)); geometry.computeBoundingBox(); geometries.set(index, geometry);
    decoderModule.destroy(face); decoderModule.destroy(mesh); decoderModule.destroy(buffer); decoderModule.destroy(decoder);
  }
  const nodes = {};
  for (const node of doc.nodes) if (node.mesh !== undefined) {
    const object = new Mesh(geometries.get(node.mesh), new MeshBasicMaterial()); object.name = node.name;
    if (node.matrix) new Matrix4().fromArray(node.matrix).decompose(object.position, object.quaternion, object.scale);
    else { if (node.translation) object.position.fromArray(node.translation); if (node.rotation) object.quaternion.fromArray(node.rotation); if (node.scale) object.scale.fromArray(node.scale); }
    nodes[object.name] = object;
  }
  return nodes;
}
