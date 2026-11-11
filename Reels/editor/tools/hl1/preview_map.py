# Prévia do mapa convertido no Blender: a luz do jogo (cor de vértice × textura, emissiva), câmera num ponto do mapa.
# Uso: blender -b -P tools/hl1/preview_map.py -- <mapa.glb> <saida.png> cx cy cz tx ty tz [lente] [gman.glb gx gy gz yaw anim quadro]
import sys, math, bpy, mathutils

a = sys.argv[sys.argv.index("--") + 1:]
src, out = a[0], a[1]
cam_p = mathutils.Vector([float(x) for x in a[2:5]])
tgt = mathutils.Vector([float(x) for x in a[5:8]])
lens = float(a[8]) if len(a) > 8 else 20
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    nt = m.node_tree
    img = next((n for n in nt.nodes if n.type == "TEX_IMAGE"), None)
    outn = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None)
    vc = nt.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "Color"
    mul = nt.nodes.new("ShaderNodeMixRGB")
    mul.blend_type = "MULTIPLY"
    mul.inputs[0].default_value = 1
    if img:
        nt.links.new(img.outputs[0], mul.inputs[1])
    nt.links.new(vc.outputs[0], mul.inputs[2])
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[1].default_value = 1.6
    nt.links.new(mul.outputs[0], em.inputs[0])
    if img and m.blend_method != "OPAQUE" or (img and "{" in m.name):
        tr = nt.nodes.new("ShaderNodeBsdfTransparent")
        mix = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(img.outputs[1], mix.inputs[0])
        nt.links.new(tr.outputs[0], mix.inputs[1])
        nt.links.new(em.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], outn.inputs[0])
    else:
        nt.links.new(em.outputs[0], outn.inputs[0])
    if img:
        img.interpolation = "Closest"
if len(a) > 9:
    gsrc = a[9]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=gsrc)
    new = [o for o in bpy.data.objects if o not in before]
    root = next(o for o in new if o.parent is None and o.name.startswith("hl1_"))
    root.location = mathutils.Vector([float(x) for x in a[10:13]])
    root.rotation_euler[2] = math.radians(float(a[13]))
    arm = next((o for o in new if o.type == "ARMATURE"), None)
    act = a[14] if len(a) > 14 else None
    if arm and act in bpy.data.actions:
        arm.animation_data_create()
        arm.animation_data.action = bpy.data.actions[act]
        if hasattr(arm.animation_data, "action_slot") and bpy.data.actions[act].slots:
            arm.animation_data.action_slot = bpy.data.actions[act].slots[0]
    bpy.context.scene.frame_set(int(a[15]) if len(a) > 15 else 1)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3
    sun.rotation_euler = (0.9, 0.3, 0.6)
    bpy.context.scene.collection.objects.link(sun)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.lens = lens
cam.data.clip_end = 20000
bpy.context.scene.collection.objects.link(cam)
cam.location = cam_p
cam.rotation_euler = (tgt - cam_p).to_track_quat("-Z", "Y").to_euler()
sc = bpy.context.scene
sc.camera = cam
sc.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE_NEXT"
sc.world = bpy.data.worlds.new("w")
sc.world.color = (0, 0, 0)
sc.render.resolution_x, sc.render.resolution_y = 960, 540
sc.render.filepath = out
deps = bpy.context.evaluated_depsgraph_get()
for probe in a[16:]:
    x, y = [float(v) for v in probe.split(",")]
    hit = sc.ray_cast(deps, mathutils.Vector((x, y, 2000)), mathutils.Vector((0, 0, -1)))
    print("PROBE", x, y, hit[0] and round(hit[1].z, 1))
bpy.ops.render.render(write_still=True)
