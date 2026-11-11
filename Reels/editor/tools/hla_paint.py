# Retrato pintado de um modelo real do Half-Life: Alyx (glb do Source 2 Viewer) no Blender, sem interface.
# Luz quente de frente, contraluz fria, e o filtro Kuwahara do compositor para virar pintura (borda de pincel, sem contorno).
# Uso: blender -b -P tools/hla_paint.py -- <modelo.glb> <saida.png> <azimute_graus> [enquadre: rosto|corpo] [animação] [quadro] [kuwahara]
import sys, math, bpy, mathutils

a = sys.argv[sys.argv.index("--") + 1:]
src, out, az = a[0], a[1], float(a[2])
frame_kind = a[3] if len(a) > 3 else "rosto"
anim = a[4] if len(a) > 4 and a[4] != "-" else None
fr = int(a[5]) if len(a) > 5 else 1
kuw = int(a[6]) if len(a) > 6 else 9

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
sc = bpy.context.scene
arm = next((o for o in sc.objects if o.type == "ARMATURE"), None)
if arm and arm.animation_data:
    acts = [x for x in bpy.data.actions if anim and anim.lower() in x.name.lower()]
    arm.animation_data.action = acts[0] if acts else None
    if arm.animation_data.action and hasattr(arm.animation_data, "action_slot") and arm.animation_data.action.slots:
        arm.animation_data.action_slot = arm.animation_data.action.slots[0]
sc.frame_set(fr)
# só a malha visível (o glb traz física e LODs às vezes)
meshes = [o for o in sc.objects if o.type == "MESH" and "physics" not in o.name.lower() and not o.name.startswith("Icosphere")]
for o in sc.objects:
    if o.type == "MESH" and o not in meshes:
        o.hide_render = True
deps = bpy.context.evaluated_depsgraph_get()
pts = []
for o in meshes:
    ev = o.evaluated_get(deps)
    m = ev.to_mesh()
    mw = o.matrix_world
    st = max(1, len(m.vertices) // 4000)
    pts += [mw @ m.vertices[i].co for i in range(0, len(m.vertices), st)]
    ev.to_mesh_clear()
mn = mathutils.Vector([min(p[i] for p in pts) for i in range(3)])
mx = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
h = mx.z - mn.z
cx, cy = (mn.x + mx.x) / 2, (mn.y + mx.y) / 2
print("BBOX", [round(v, 2) for v in mn], [round(v, 2) for v in mx])
if frame_kind == "rosto":
    tgt = mathutils.Vector((cx, cy, mx.z - h * 0.075))
    dist, lens = h * 0.9, 85
else:
    tgt = mathutils.Vector((cx, cy, mn.z + h * 0.52))
    dist, lens = h * 2.6, 50
r = math.radians(az)
cam_p = tgt + mathutils.Vector((math.sin(r) * dist, -math.cos(r) * dist, h * 0.02))
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.lens = lens
cam.data.clip_start = 0.01
sc.collection.objects.link(cam)
cam.location = cam_p
cam.rotation_euler = (tgt - cam_p).to_track_quat("-Z", "Y").to_euler()
sc.camera = cam


def light(name, kind, energy, color, rot_az, rot_el, size=1.0):
    L = bpy.data.lights.new(name, kind)
    L.energy = energy
    L.color = color
    if kind == "AREA":
        L.size = size
    o = bpy.data.objects.new(name, L)
    sc.collection.objects.link(o)
    ra, re = math.radians(az + rot_az), math.radians(rot_el)
    d = h * 1.5
    o.location = tgt + mathutils.Vector((math.sin(ra) * math.cos(re) * d, -math.cos(ra) * math.cos(re) * d, math.sin(re) * d))
    o.rotation_euler = (tgt - o.location).to_track_quat("-Z", "Y").to_euler()


# chave quente de lado-frente, preenchimento frio fraco, contraluz azulada (o céu do gelo)
light("key", "AREA", 260 * h * h, (1.0, 0.82, 0.62), -38, 28, h * 0.6)
light("fill", "AREA", 50 * h * h, (0.62, 0.74, 1.0), 55, 5, h * 0.8)
light("rim", "AREA", 420 * h * h, (0.6, 0.78, 1.0), 160, 20, h * 0.4)
sc.world = bpy.data.worlds.new("w")
sc.world.color = (0.035, 0.045, 0.07)
sc.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE_NEXT"
sc.render.resolution_x, sc.render.resolution_y = (1000, 1000) if frame_kind == "rosto" else (800, 1200)
sc.render.film_transparent = True
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Medium High Contrast" if "AgX - Medium High Contrast" in [x.identifier for x in bpy.types.ColorManagedViewSettings.bl_rna.properties["look"].enum_items] else "None"
# pintura: Kuwahara anisotrópico no compositor
if kuw > 0:
    try:
        tree = bpy.data.node_groups.new("paint", "CompositorNodeTree")
        sc.compositing_node_group = tree
    except Exception:
        sc.use_nodes = True
        tree = sc.node_tree
        for n in list(tree.nodes):
            tree.nodes.remove(n)
    rl = tree.nodes.new("CompositorNodeRLayers")
    kn = tree.nodes.new("CompositorNodeKuwahara")
    try:
        kn.variation = "ANISOTROPIC"
    except Exception:
        pass
    for attr in ("size",):
        if hasattr(kn, attr):
            setattr(kn, attr, kuw)
    for inp in kn.inputs:
        if inp.name.lower() == "size":
            inp.default_value = kuw
    try:
        outn = tree.nodes.new("NodeGroupOutput")
        tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
        tree.links.new(rl.outputs["Image"], kn.inputs[0])
        tree.links.new(kn.outputs[0], outn.inputs[0])
    except Exception:
        comp = tree.nodes.new("CompositorNodeComposite")
        tree.links.new(rl.outputs["Image"], kn.inputs[0])
        tree.links.new(kn.outputs[0], comp.inputs[0])
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
