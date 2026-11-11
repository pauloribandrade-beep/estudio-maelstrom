# Prévia de um .glb no Blender (sem interface): importa, escolhe uma animação e um quadro, renderiza um PNG.
# Uso: blender -b -P tools/hl1/preview_glb.py -- <entrada.glb> <saida.png> [animação] [quadro]
import sys, bpy, mathutils

a = sys.argv[sys.argv.index("--") + 1:]
src, out = a[0], a[1]
act = a[2] if len(a) > 2 else None
frame = int(a[3]) if len(a) > 3 else 1
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
arm = next((o for o in bpy.data.objects if o.type == "ARMATURE"), None)
if arm and act and act in bpy.data.actions:
    arm.animation_data_create()
    arm.animation_data.action = bpy.data.actions[act]
    if hasattr(arm.animation_data, "action_slot") and bpy.data.actions[act].slots:
        arm.animation_data.action_slot = bpy.data.actions[act].slots[0]
bpy.context.scene.frame_set(frame)
deps = bpy.context.evaluated_depsgraph_get()
pts = []
for o in bpy.data.objects:
    if o.type == "MESH":
        e = o.evaluated_get(deps)
        pts += [e.matrix_world @ v.co for v in e.data.vertices]
mn = mathutils.Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = mathutils.Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
c = (mn + mx) / 2
h = (mx - mn).length
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
bpy.context.scene.collection.objects.link(cam)
cam.location = c + mathutils.Vector((0, -h * 1.6, h * 0.15))
cam.rotation_euler = (mathutils.Vector((0, 0, 0)) - mathutils.Vector((0, -1, 0.1))).to_track_quat("-Z", "Y").to_euler()
cam.rotation_euler = (c - cam.location).to_track_quat("-Z", "Y").to_euler()
bpy.context.scene.camera = cam
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.rotation_euler = (0.8, 0.2, 0.4)
bpy.context.scene.collection.objects.link(sun)
sc = bpy.context.scene
sc.render.engine = "BLENDER_WORKBENCH"
sc.display.shading.light = "STUDIO"
sc.display.shading.color_type = "TEXTURE"
sc.render.resolution_x, sc.render.resolution_y = 480, 640
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("dims", mx - mn, "acoes", [x.name for x in bpy.data.actions][:20])
