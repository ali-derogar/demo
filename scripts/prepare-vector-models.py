"""Prepare the user's DG100024 hoodie and W-Jacket 70 for the VECTOR showroom.

Run via node scripts/render-vector-assets.mjs. Source garment surfaces, UVs and
normals are retained; only scale, colorways and the presentation are authored here.
"""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT/'scripts/.cache/vector-imports'
TEXTURES = CACHE/'textures'
RENDERS = CACHE/'renders'
OUT = ROOT/'public/demos/vector/assets/collection'
NATIVE = ROOT/'design/vector/vector-collection.blend'
DRAFT = '--draft' in sys.argv
for path in [RENDERS, OUT, NATIVE.parent]: path.mkdir(parents=True, exist_ok=True)

def export_web(garments):
    # Keep the 4K source maps for Cycles, while bounding browser texture memory.
    copies, swaps = {}, []
    for obj in garments.values():
        for material in obj.data.materials:
            for node in material.node_tree.nodes if material.use_nodes else []:
                if node.type != 'TEX_IMAGE' or not node.image or '-normal' not in node.image.name: continue
                original = node.image
                if original not in copies:
                    web = original.copy()
                    web.name = Path(original.name).stem + '-web.jpg'
                    web.scale(2048, 2048)
                    web.filepath_raw = str(TEXTURES/web.name)
                    web.file_format = 'JPEG'
                    web.save()
                    web.pack()
                    copies[original] = web
                node.image = copies[original]
                swaps.append((node, original))
    bpy.ops.object.select_all(action='DESELECT')
    for obj in garments.values(): obj.select_set(True)
    bpy.context.view_layer.objects.active = garments['CORE']
    bpy.ops.export_scene.gltf(filepath=str(OUT/'collection.glb'), export_format='GLB', use_selection=True, export_yup=True, export_materials='EXPORT', export_extras=True, export_image_format='AUTO')
    for node, original in swaps: node.image = original
    for image in copies.values(): bpy.data.images.remove(image)

if '--web-only' in sys.argv:
    bpy.ops.wm.open_mainfile(filepath=str(NATIVE))
    export_web({name: bpy.data.objects[name] for name in ['CORE', 'DRIFT', 'SHELL']})
    sys.exit(0)

bpy.ops.wm.open_mainfile(filepath=str(CACHE/'hoodie/DG100024.blend'))
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.render.threads_mode = 'FIXED'
scene.render.threads = 6

def active(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

def normalize(obj, height):
    matrix = obj.matrix_world.copy()
    coords = [matrix @ v.co for v in obj.data.vertices]
    low = Vector(tuple(min(v[i] for v in coords) for i in range(3)))
    high = Vector(tuple(max(v[i] for v in coords) for i in range(3)))
    center = (low + high) / 2
    factor = height / (high.z - low.z)
    for vertex, coord in zip(obj.data.vertices, coords): vertex.co = (coord - center) * factor
    obj.matrix_world.identity()
    obj.data.update()
    bpy.context.view_layer.update()

def image(name, noncolor=False):
    result = bpy.data.images.load(str(TEXTURES/name), check_existing=True)
    if noncolor: result.colorspace_settings.name = 'Non-Color'
    return result

def texture(material, source, socket, noncolor=False):
    nodes = material.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    node = nodes.new('ShaderNodeTexImage')
    node.image = image(source, noncolor)
    material.node_tree.links.new(node.outputs['Color'], bsdf.inputs[socket])
    return node

source = bpy.data.objects['DG100024']
normalize(source, .80)
garments = {}
for theme in ['CORE', 'DRIFT']:
    obj = source.copy()
    obj.data = source.data.copy()
    bpy.context.collection.objects.link(obj)
    obj.name = theme
    obj['sourceArchive'] = 'models/Blender.zip'
    obj['sourceModel'] = 'DG100024'
    obj['colorway'] = 'bone' if theme == 'CORE' else 'oxblood'
    for slot in obj.material_slots:
        material = slot.material.copy()
        slot.material = material
        material.name = theme + ' / ' + material.name.split('_FRONT')[0]
        bsdf = material.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Roughness'].default_value = .88
        bsdf.inputs['Sheen Weight'].default_value = .12
        for node in material.node_tree.nodes:
            if node.type == 'TEX_IMAGE':
                if 'diffuse' in node.image.name: node.image = image('hoodie-'+theme.lower()+'-color.jpg')
                elif 'normal' in node.image.name: node.image = image('hoodie-normal.jpg', True)
    garments[theme] = obj
bpy.data.objects.remove(source, do_unlink=True)

active(garments['CORE'])
bpy.ops.wm.obj_import(filepath=str(next((CACHE/'jacket').glob('*.obj'))), forward_axis='NEGATIVE_Z', up_axis='Y')
jacket = bpy.context.object
jacket.name = 'SHELL'
normalize(jacket, .76)
jacket['sourceArchive'] = 'models/Jacket+70_obj.zip'
jacket['sourceModel'] = 'W-Jacket 70'
jacket['colorway'] = 'charcoal fleece'
for material in jacket.data.materials:
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    if material.name == 'uniform_1001':
        texture(material, 'jacket-color.jpg', 'Base Color')
        texture(material, 'jacket-roughness.jpg', 'Roughness', True)
        texture(material, 'jacket-metal.jpg', 'Metallic', True)
        for node in material.node_tree.nodes:
            if node.type == 'TEX_IMAGE' and node.image and 'uniformNormal' in node.image.name:
                node.image = image('jacket-normal.jpg', True)
        bsdf.inputs['Sheen Weight'].default_value = .14
    for link in list(material.node_tree.links):
        if link.to_node == bsdf and link.to_socket == bsdf.inputs['Alpha']:
            material.node_tree.links.remove(link)
    bsdf.inputs['Alpha'].default_value = 1
    material.name = 'SHELL / ' + material.name
garments['SHELL'] = jacket

# Export the exact supplied mesh surfaces, without a remesh or cloth simulation.
for obj in garments.values():
    obj.hide_render = False
    for material in obj.data.materials:
        if material: material.use_backface_culling = False
export_web(garments)

def rgb(code):
    values = [int(code[i:i+2], 16)/255 for i in (0, 2, 4)]
    return tuple(v/12.92 if v < .04045 else ((v+.055)/1.055)**2.4 for v in values)

def material(name, color, roughness=.8):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    bsdf = result.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb(color), 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return result

chalk = material('VECTOR / bone type', 'BCB5A0')
basalt = material('VECTOR / basalt', '303B31')
stone = material('VECTOR / honed stone', '6B6C5E')
orange = material('VECTOR / signal orange', 'E95C38')
backdrop = material('Photographic warm grey', 'D5D2C9', .92)

def aim(obj, target): obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

def text(body, location, size, name):
    data = bpy.data.curves.new(name, 'FONT')
    data.body = body; data.size = size; data.align_x = 'CENTER'
    data.extrude = .001; data.bevel_depth = .0002; data.resolution_u = 10
    obj = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(obj)
    obj.location = location; obj.rotation_euler = (math.pi/2, 0, 0); obj.data.materials.append(chalk)
    return obj

letters = []
for body, z, size, name in [('VECTOR',0,.56,'VectorWordmark'), ('FORM / DIRECTION / FREEDOM',-.12,.045,'StudioSignature'), ('CORE',0,.23,'CoreTitle'), ('DRIFT',0,.23,'DriftTitle'), ('SHELL',0,.23,'ShellTitle')]:
    obj = text(body, (0,0,z), size, name)
    active(obj); bpy.ops.object.convert(target='MESH')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    letters.append(obj)
bpy.ops.object.select_all(action='DESELECT')
for obj in letters: obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'lettering.glb'), export_format='GLB', use_selection=True)
for obj in letters: obj.hide_render = True

def area(name, location, power, size, color):
    data = bpy.data.lights.new(name, 'AREA'); data.energy = power; data.shape = 'DISK'; data.size = size; data.color = color
    obj = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(obj); obj.location = location; aim(obj, (0,0,.2))
    return obj

lights = [area('Large diffused key', (-1.8,-2.6,2.4), 210, 2.1, (1,.96,.90)), area('Soft fill', (1.8,-1.5,.7), 70, 2, (.92,.96,1)), area('Fabric rim', (.5,1.5,2), 240, 1.6, (1,1,1))]
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.25,.25,.25,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .30
scene.render.engine = 'CYCLES'; scene.cycles.use_denoising = True; scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 3; scene.cycles.glossy_bounces = 3; scene.cycles.adaptive_threshold = .02
scene.render.image_settings.file_format = 'PNG'; scene.view_settings.view_transform = 'AgX'
data = bpy.data.cameras.new('85 mm product camera'); camera = bpy.data.objects.new('85 mm product camera', data)
bpy.context.collection.objects.link(camera); scene.camera = camera; data.lens = 85
path = [(-5,-.47),(1,-.47)] + [(1+math.sin(t), .53-math.cos(t)) for t in [i*math.pi/2/32 for i in range(1,33)]] + [(2,4)]
verts = [(x,y,z) for y,z in path for x in [-8,8]]
faces = [(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(path)-1)]
mesh = bpy.data.meshes.new('Photographic sweep'); mesh.from_pydata(verts, [], faces); mesh.update()
sweep = bpy.data.objects.new('Photographic sweep', mesh); bpy.context.collection.objects.link(sweep); sweep.data.materials.append(backdrop)
for polygon in sweep.data.polygons: polygon.use_smooth = True

def render(name, width=1200, height=1400):
    scene.cycles.samples = 20 if DRAFT else (64 if 'product' in name or 'closeup' in name else 36)
    scene.render.resolution_x = width; scene.render.resolution_y = height; scene.render.resolution_percentage = 100
    scene.render.filepath = str(RENDERS/(name+'.png')); bpy.ops.render.render(write_still=True)

for kind, obj in garments.items():
    for garment in garments.values(): garment.hide_render = garment != obj
    camera.location = (.50,-3.0,.35); aim(camera, (0,0,0)); data.lens = 85
    render(kind.lower()+'-product', 900 if DRAFT else 1200, 1050 if DRAFT else 1400)
    if not DRAFT:
        camera.location = (.14,-1.65,.23); aim(camera, (0,-.04,.15)); data.lens = 95
        render(kind.lower()+'-closeup',1200,1200)
if DRAFT:
    print('SUPPLIED CLOTHING DRAFT COMPLETE', flush=True)
    sys.exit(0)

def block(name, location, size, surface):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object; obj.name = name; obj.scale = size; obj.data.materials.append(surface)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new('Soft architectural edge', 'BEVEL'); bevel.width = .004; bevel.segments = 3
    return obj

sweep.hide_render = True
environment = [block('Stone floor',(0,0,-.025),(12,8,.05),stone), block('Basalt backdrop',(0,.93,1.8),(8,.08,4),basalt), text('VECTOR',(0,.876,1.13),.605,'VECTOR studio wall'), text('FORM / DIRECTION / FREEDOM',(0,.874,1.08),.045,'VECTOR signature')]
for index,x in enumerate([.7,0,-.7]):
    environment.append(block('Plinth '+str(index),(x,.1 if x else 0,.16),(.57,.54,.32),basalt))
    environment.append(block('Signal inlay '+str(index),(x,-.172 if x else -.272,.29),(.4,.003,.003),orange))
for kind,x,yaw in [('CORE',.7,-.12),('DRIFT',0,0),('SHELL',-.7,.12)]:
    obj = garments[kind]; obj.hide_render = False; obj.location = (x,.1 if x else 0,.76); obj.rotation_euler.z = yaw
data.lens = 55; camera.location = (.06,-4.4,1.45); aim(camera,(0,0,.84)); render('hero-01',1536,1024)
camera.location = (.30,-4.35,1.45); aim(camera,(0,0,.85)); render('campaign',1600,1067)
for kind in garments:
    obj = garments[kind]
    for garment in garments.values(): garment.hide_render = garment != obj
    obj.location = (0,0,.76); obj.rotation_euler.z = 0
    data.lens = 65; camera.location = (.25,-3.3,1.25); aim(camera,(0,0,.8)); render('room-'+kind.lower(),1440,960)
    for item in environment: item.hide_render = True
    sweep.hide_render = False; obj.location = (0,0,0); obj.rotation_euler.z = .3
    data.lens = 85; camera.location = (.25,-3.1,.4); aim(camera,(0,0,0)); render('detail-'+kind.lower(),1440,960)
    sweep.hide_render = True
    for item in environment: item.hide_render = False
    obj.location = (.5,0,.76); obj.rotation_euler.z = -.22
    data.lens = 55; camera.location = (.25,-3.8,1.3); aim(camera,(0,0,.82)); render('film-'+kind.lower(),1440,960)
for obj in garments.values(): obj.location = (0,0,0); obj.rotation_euler = (0,0,0); obj.hide_render = False
for item in environment: item.hide_render = True
sweep.hide_render = False
for material in bpy.data.materials:
    if not material.use_nodes: continue
    for node in material.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image and node.image.has_data: node.image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(NATIVE), compress=True)
print('SUPPLIED VECTOR COLLECTION COMPLETE', flush=True)
