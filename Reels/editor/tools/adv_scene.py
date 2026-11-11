# Advisor no casulo (Half-Life 2 / Episode Two): os modelos do jogo num quarto escuro de vigilância Combine.
# Uso: blender -b -P tools/adv_scene.py -- <cena.json> <pasta de saída>
# cena.json: {"res": [w, h], "samples": 8, "frames": N, "stills": [..] (opcional), "fps": 30,
#   "advisor": {"mdl", "pos": [x,y,z], "rot": [rx,ry,rz], "clips": [{"action", "at", "loop", "speed"}], "freeze_at": quadro,
#               "sink": [q0, q1, metros] (afunda depois de parar)},
#   "pod": {"mdl", "pos", "rot", "scale"}, "lights": [{"pos", "color", "energy", "size", "off": [q0, q1]}],
#   "tint": [r,g,b] (cor do ar), "fog": densidade, "cam_keys": [[quadro, pos, alvo]], "lens": 35, "exposure": 0, "noise": 0..1}
import json, math, sys, os, bpy, mathutils, addon_utils, random

V = mathutils.Vector
a = sys.argv[sys.argv.index("--") + 1:]
spec = json.load(open(a[0], encoding="utf-8"))
out = a[1]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
addon_utils.enable("SourceIO")
sc = bpy.context.scene
N_FR = spec.get("frames", 1)
sc.frame_start, sc.frame_end = 1, N_FR
sc.render.fps = spec.get("fps", 30)


def imp(mdl, anims):
    before = set(bpy.data.objects)
    bpy.ops.sourceio.mdl(filepath=mdl, directory=os.path.dirname(mdl) + "/", files=[{"name": os.path.basename(mdl)}],
                         import_animations=anims, import_include_animations=anims, import_textures=True, scale=0.0254)
    new = set(bpy.data.objects) - before
    root = [o for o in new if o.parent is None]
    return new, root


def fcurves_of(A):
    if hasattr(A, "fcurves") and len(A.fcurves):
        return list(A.fcurves)
    fc = []
    for ly in getattr(A, "layers", []):
        for st in ly.strips:
            for cb in st.channelbags:
                fc += list(cb.fcurves)
    return fc


# ---------------------------------------------------------------- o quarto: chão de metal, paredes, névoa
tint = spec.get("tint", [0.35, 0.55, 0.7])
w = bpy.data.worlds.new("w")
sc.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (*[c * 0.02 for c in tint], 1)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 4))
room = bpy.context.object
room.scale = (spec.get("room", [16, 16, 10]))
rm = bpy.data.materials.new("sala")
rm.use_nodes = True
rb = rm.node_tree.nodes["Principled BSDF"]
rb.inputs["Base Color"].default_value = (0.03, 0.035, 0.04, 1)
rb.inputs["Metallic"].default_value = 0.8
rb.inputs["Roughness"].default_value = 0.45
room.data.materials.append(rm)
for f_ in room.data.polygons:
    f_.flip()
# painéis nas paredes (linhas de luz fria, como os monitores Combine)
for i in range(14):
    ang = i / 14 * math.tau
    r_ = spec.get("room", [16, 16, 10])[0] / 2 - 0.05
    bpy.ops.mesh.primitive_plane_add(size=1, location=(r_ * math.cos(ang), r_ * math.sin(ang), 2 + (i % 3)))
    p_ = bpy.context.object
    p_.scale = (0.08, 1.6, 1)
    p_.rotation_euler = (0, math.pi / 2, ang)
    pm = bpy.data.materials.new("painel%d" % i)
    pm.use_nodes = True
    pb = pm.node_tree.nodes["Principled BSDF"]
    pb.inputs["Emission Color"].default_value = (*tint, 1)
    pb.inputs["Emission Strength"].default_value = spec.get("panel_glow", 2.0)
    p_.data.materials.append(pm)
    if spec.get("panels_off"):
        q0, q1 = spec["panels_off"]
        qq = q0 + (q1 - q0) * ((i * 7) % 14) / 14
        pb.inputs["Emission Strength"].keyframe_insert("default_value", frame=int(qq))
        pb.inputs["Emission Strength"].default_value = 0.05
        pb.inputs["Emission Strength"].keyframe_insert("default_value", frame=int(qq) + 3)
# névoa no ar
if spec.get("fog", 0) > 0:
    vm = bpy.data.materials.new("nevoa")
    vm.use_nodes = True
    nt = vm.node_tree
    nt.nodes.remove(nt.nodes["Principled BSDF"])
    vs = nt.nodes.new("ShaderNodeVolumePrincipled")
    vs.inputs["Density"].default_value = spec["fog"]
    vs.inputs["Color"].default_value = (*tint, 1)
    nt.links.new(vs.outputs[0], nt.nodes["Material Output"].inputs["Volume"])
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 4))
    fo = bpy.context.object
    fo.scale = [s - 0.2 for s in spec.get("room", [16, 16, 10])]
    fo.data.materials.append(vm)

# ---------------------------------------------------------------- casulo
if spec.get("pod"):
    pd = spec["pod"]
    new, root = imp(pd["mdl"], False)
    for o in root:
        o.location = V(pd["pos"])
        o.rotation_euler = [math.radians(r) for r in pd.get("rot", (0, 0, 0))]
        o.scale = (pd.get("scale", 1),) * 3
        if pd.get("sink"):
            q0, q1, dz = pd["sink"]
            o.keyframe_insert("location", frame=q0)
            o.location.z -= dz
            o.keyframe_insert("location", frame=q1)

# ---------------------------------------------------------------- Advisor
ADV = None
if spec.get("advisor"):
    ad = spec["advisor"]
    new, root = imp(ad["mdl"], True)
    arm = next((o for o in new if o.type == "ARMATURE"), None)
    ADV = root
    for o in root:
        o.location = V(ad["pos"])
        o.rotation_euler = [math.radians(r) for r in ad.get("rot", (0, 0, 0))]
    print("ACTIONS", [x.name for x in bpy.data.actions])
    bpy.context.view_layer.update()
    for o in new:
        if o.type == "MESH":
            bb = [o.matrix_world @ V(c) for c in o.bound_box]
            print("BBOX", o.name, [round(min(p[i] for p in bb), 2) for i in range(3)], [round(max(p[i] for p in bb), 2) for i in range(3)])
    if arm:
        print("BONES", len(arm.pose.bones), [b.name for b in arm.pose.bones][:80])
    if arm and ad.get("breathe"):
        # o modelo do Episode Two não tem animação: o corpo respira e os braços/tubos balançam com ruído nos ossos;
        # em "freeze_at" tudo para no mesmo quadro (a pose fica exatamente onde estava)
        br = ad["breathe"]
        fz = ad.get("freeze_at", N_FR + 1)
        rr = random.Random(3)
        sel = [b for b in arm.pose.bones if any(k in b.name.lower() for k in br.get("match", ["arm", "tent", "hose", "tube", "body", "spine", "head", "neck", "tail", "finger"]))]
        print("BREATHE", len(sel))
        for b in sel:
            b.rotation_mode = "XYZ"
            ph = rr.uniform(0, 6.28)
            fq = rr.uniform(0.6, 1.4) * br.get("speed", 0.5)
            amp = math.radians(br.get("amp", 4)) * rr.uniform(0.5, 1.2)
            # "look": [q0, q1, graus] = sente alguma coisa: pescoço e cabeça viram de uma vez e ficam
            lk = br.get("look")
            # só o pescoço: girar o osso da cabeça faz a língua vermelha furar a máscara
            isn = "neck" in b.name.lower() and "fat" not in b.name.lower()
            for fr_ in sorted(set(list(range(1, min(fz, N_FR) + 1, 4)) + [min(fz, N_FR)] + ([lk[0], lk[1]] if lk else []))):
                t = fr_ / 30.0
                yaw = 0.0
                if lk and isn and fr_ > lk[0]:
                    u = min(1.0, (fr_ - lk[0]) / max(1, lk[1] - lk[0]))
                    yaw = math.radians(lk[2]) * u * u * (3 - 2 * u)
                b.rotation_euler = (amp * math.sin(t * fq * 6.28 + ph), amp * 0.6 * math.sin(t * fq * 4.1 + ph * 1.7), amp * 0.4 * math.cos(t * fq * 3.3 + ph) + yaw)
                b.keyframe_insert("rotation_euler", frame=fr_)
    if arm and ad.get("clips"):
        if not arm.animation_data:
            arm.animation_data_create()
        arm.animation_data.action = None
        for i, c in enumerate(ad["clips"]):
            A = next((x for x in bpy.data.actions if x.name.lstrip("@") == c["action"] or x.name.endswith(c["action"])), None)
            if not A:
                print("SEM ACAO", c["action"])
                continue
            tr = arm.animation_data.nla_tracks.new()
            st = tr.strips.new("%s_%d" % (c["action"], i), int(c.get("at", 1)), A)
            if hasattr(st, "action_slot") and A.slots:
                st.action_slot = A.slots[0]
            st.scale = 1.0 / c.get("speed", 1.0)
            if c.get("loop"):
                st.repeat = max(1.0, math.ceil((N_FR - c.get("at", 1)) / max(1.0, (A.frame_range[1] - A.frame_range[0]) * st.scale)) + 1)
            st.extrapolation = "HOLD" if i == 0 else "HOLD_FORWARD"
            if i > 0:
                st.blend_in = c.get("blend", 10)
        if ad.get("freeze_at"):
            # para no mesmo instante: o tempo da animação deixa de andar (a pose fica exatamente onde estava)
            fz = ad["freeze_at"]
            for tr in arm.animation_data.nla_tracks:
                for st in tr.strips:
                    st.use_animated_time = True
                    # tempo local da faixa = quadro da cena até parar; depois fica preso
                    t_end = (fz - st.frame_start) / max(1e-6, st.scale) + st.action_frame_start
                    st.strip_time = st.action_frame_start
                    st.keyframe_insert("strip_time", frame=st.frame_start)
                    st.strip_time = (fz - st.frame_start) * (st.action_frame_end - st.action_frame_start) * st.repeat / max(1.0, st.frame_end - st.frame_start) + st.action_frame_start
                    st.keyframe_insert("strip_time", frame=fz)
                    st.keyframe_insert("strip_time", frame=N_FR + 1)
    if ad.get("sink"):
        q0, q1, dz = ad["sink"]
        for o in root:
            o.keyframe_insert("location", frame=q0)
            o.location.z -= dz
            o.keyframe_insert("location", frame=q1)

# ---------------------------------------------------------------- luzes
for i, L in enumerate(spec.get("lights", [])):
    ld = bpy.data.lights.new("l%d" % i, L.get("type", "AREA"))
    ld.energy = L.get("energy", 300)
    ld.color = L.get("color", [1, 1, 1])
    if ld.type == "AREA":
        ld.size = L.get("size", 2)
    lo = bpy.data.objects.new("l%d" % i, ld)
    sc.collection.objects.link(lo)
    lo.location = V(L["pos"])
    lo.rotation_euler = (V(L.get("aim", (0, 0, 2))) - lo.location).to_track_quat("-Z", "Y").to_euler()
    if L.get("off"):
        q0, q1 = L["off"]
        ld.keyframe_insert("energy", frame=q0)
        # falha antes de apagar: pisca
        rr = random.Random(i)
        for fr_ in range(q0 + 2, q1, 3):
            ld.energy = L.get("energy", 300) * rr.choice([0.1, 1.0, 0.4, 0.0])
            ld.keyframe_insert("energy", frame=fr_)
        ld.energy = L.get("energy", 300) * L.get("off_level", 0.0)
        ld.keyframe_insert("energy", frame=q1)

# ---------------------------------------------------------------- câmera
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.lens = spec.get("lens", 35)
cam.data.clip_end = 500
sc.collection.objects.link(cam)
sc.camera = cam
cam.rotation_mode = "QUATERNION"
for f_, cp, lp in spec["cam_keys"]:
    cam.location = V(cp)
    cam.rotation_quaternion = (V(lp) - cam.location).to_track_quat("-Z", "Y")
    cam.keyframe_insert("location", frame=f_)
    cam.keyframe_insert("rotation_quaternion", frame=f_)
if cam.animation_data and cam.animation_data.action:
    for fc in fcurves_of(cam.animation_data.action):
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.easing = "AUTO"

# ---------------------------------------------------------------- render
sc.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE_NEXT"
sc.eevee.taa_render_samples = spec.get("samples", 8)
if hasattr(sc.eevee, "use_raytracing"):
    sc.eevee.use_raytracing = False
if hasattr(sc.eevee, "volumetric_tile_size"):
    sc.eevee.volumetric_tile_size = "8"
sc.render.resolution_x, sc.render.resolution_y = spec.get("res", [1280, 720])
sc.render.resolution_percentage = 100
sc.view_settings.view_transform = "AgX" if "AgX" in [x.identifier for x in bpy.types.ColorManagedViewSettings.bl_rna.properties["view_transform"].enum_items] else "Filmic"
sc.view_settings.exposure = spec.get("exposure", 0)
sc.render.image_settings.file_format = "PNG"
frames = spec.get("stills") or list(range(1, N_FR + 1))
pre = "s_" if spec.get("stills") else "f_"
if spec.get("range"):
    frames = [x for x in frames if spec["range"][0] <= x <= spec["range"][1]]
for fr in frames:
    sc.frame_set(fr)
    sc.render.filepath = os.path.join(out, "%s%04d.png" % (pre, fr))
    bpy.ops.render.render(write_still=True)
print("fim")
