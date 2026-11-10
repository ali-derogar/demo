/** Inspect the shipped clothing GLBs in Node without a GPU or browser. */
import { readFile } from 'node:fs/promises';
import { BufferGeometry, Mesh, Matrix4 } from 'three';
import { Group, BufferAttribute, MeshStandardMaterial, DoubleSide, Texture } from 'three';
import draco from 'draco3dgltf';
let decoderPromise;

/** Read Blender GLBs with or without Draco, preserving hierarchy and PBR slots. */
export async function decodeCollection(file) {
  const data = await readFile(file), jsonLength = data.readUInt32LE(12);
  if (data.toString('utf8', 0, 4) !== 'glTF') throw new Error('Invalid GLB: ' + file);
  const doc = JSON.parse(data.toString('utf8', 20, 20 + jsonLength)), bin = data.subarray(28 + jsonLength);
  const types = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
  const sizes = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  function attribute(index) {
    const item = doc.accessors[index], view = doc.bufferViews[item.bufferView], Constructor = types[item.componentType];
    const offset = (view.byteOffset || 0) + (item.byteOffset || 0), size = sizes[item.type];
    if (view.byteStride) throw new Error('Unexpected interleaved clothing asset');
    const bytes = bin.subarray(offset, offset + item.count * size * Constructor.BYTES_PER_ELEMENT);
    return new BufferAttribute(new Constructor(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length)), size, item.normalized);
  }
  const materials = (doc.materials || []).map((item) => {
    const pbr = item.pbrMetallicRoughness || {}, material = new MeshStandardMaterial({ roughness: pbr.roughnessFactor ?? 1, metalness: pbr.metallicFactor ?? 0 });
    material.name = item.name;
    if (pbr.baseColorFactor) material.color.fromArray(pbr.baseColorFactor);
    if (item.doubleSided) material.side = DoubleSide;
    if (item.normalTexture) { material.normalMap = new Texture(); material.normalMap.name = 'Supplied textile normal map'; }
    return material;
  });
  const decoded = new Map();
  if (doc.extensionsUsed?.includes('KHR_draco_mesh_compression')) {
    const module = await (decoderPromise ??= draco.createDecoderModule({}));
    for (const mesh of doc.meshes) for (const primitive of mesh.primitives) {
      const compressed = primitive.extensions?.KHR_draco_mesh_compression; if (!compressed) continue;
      const view = doc.bufferViews[compressed.bufferView], bytes = bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
      const buffer = new module.DecoderBuffer(); buffer.Init(new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length), bytes.length);
      const decoder = new module.Decoder(), result = new module.Mesh(), status = decoder.DecodeBufferToMesh(buffer, result);
      if (!status.ok()) throw new Error(status.error_msg());
      const geometry = new BufferGeometry();
      for (const [key, id] of Object.entries(compressed.attributes)) {
        const attribute = decoder.GetAttributeByUniqueId(result, id), values = new module.DracoFloat32Array();
        decoder.GetAttributeFloatForAllPoints(result, attribute, values); const array = new Float32Array(result.num_points() * attribute.num_components());
        for (let i = 0; i < array.length; i++) array[i] = values.GetValue(i);
        const name = { POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv', TANGENT: 'tangent' }[key];
        if (name) geometry.setAttribute(name, new BufferAttribute(array, attribute.num_components())); module.destroy(values);
      }
      const face = new module.DracoInt32Array(), indices = new Uint32Array(result.num_faces() * 3);
      for (let i = 0; i < result.num_faces(); i++) { decoder.GetFaceFromMesh(result, i, face); for (let j = 0; j < 3; j++) indices[i * 3 + j] = face.GetValue(j); }
      geometry.setIndex(new BufferAttribute(indices, 1)); geometry.computeBoundingBox(); decoded.set(primitive, geometry);
      module.destroy(face); module.destroy(result); module.destroy(buffer); module.destroy(decoder);
    }
  }
  function node(index) {
    const definition = doc.nodes[index], object = new Group(); object.name = definition.name || 'Node' + index; object.userData = definition.extras || {};
    if (definition.matrix) new Matrix4().fromArray(definition.matrix).decompose(object.position, object.quaternion, object.scale);
    else { if (definition.translation) object.position.fromArray(definition.translation); if (definition.rotation) object.quaternion.fromArray(definition.rotation); if (definition.scale) object.scale.fromArray(definition.scale); }
    if (definition.mesh !== undefined) for (const [i, primitive] of doc.meshes[definition.mesh].primitives.entries()) {
      const geometry = decoded.get(primitive) || new BufferGeometry();
      if (!decoded.has(primitive)) {
      for (const [key, accessor] of Object.entries(primitive.attributes)) {
        const name = { POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv', TANGENT: 'tangent' }[key];
        if (name) geometry.setAttribute(name, attribute(accessor));
      }
      if (primitive.indices !== undefined) geometry.setIndex(attribute(primitive.indices));
      }
      geometry.computeBoundingBox(); const mesh = new Mesh(geometry, materials[primitive.material]); mesh.name = object.name + '/panel-' + i; object.add(mesh);
    }
    for (const child of definition.children || []) object.add(node(child)); return object;
  }
  return Object.fromEntries(doc.scenes[doc.scene || 0].nodes.map((index) => { const object = node(index); return [object.name, object]; }));
}
