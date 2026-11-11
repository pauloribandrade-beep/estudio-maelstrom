# Uma cena inteira pintada no Blender: o cenário de neve (chão, morros de gelo, céu do entardecer, névoa) e os personagens
# reais do Half-Life: Alyx posados, tudo com o mesmo filtro de pincel (Kuwahara) para virar uma pintura só.
# Uso: blender -b -P tools/hla_scene.py -- <cena.json> <saida.png>
# cena.json: { "cam": [x,y,z], "look": [x,y,z], "lens": 50, "sun": [azimute, elevação], "kuwahara": 7,
#              "chars": [{ "glb": "...", "pos": [x,y], "rot": graus, "action": "refPose", "frame": 1, "pose": {"osso": [eixo, graus], ...} }] }
import json, math, sys, bpy, mathutils

a = sys.argv[sys.argv.index("--") + 1:]
spec = json.load(open(a[0], encoding="utf-8"))
out = a[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
V = mathutils.Vector
AX = {"x": V((1, 0, 0)), "y": V((0, 1, 0)), "z": V((0, 0, 1))}


def mat(name, base, rough=0.8, sss=0.0, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*base, 1)
    b.inputs["Roughness"].default_value = rough
    if sss and "Subsurface Weight" in b.inputs:
        b.inputs["Subsurface Weight"].default_value = sss
    return m


def slope_mat(name, snow, rock=(0.11, 0.13, 0.17)):
    # neve onde é plano, rocha azul-escura onde a encosta é íngreme (borda quebrada por ruído)
    m = mat(name, snow, 0.55, 0.08)
    nt_ = m.node_tree
    n_ = nt_.nodes
    geo = n_.new("ShaderNodeNewGeometry")
    sep = n_.new("ShaderNodeSeparateXYZ")
    nz = n_.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 0.08
    nz.inputs["Detail"].default_value = 10
    nt_.links.new(geo.outputs["Normal"], sep.inputs[0])
    jit = n_.new("ShaderNodeMath")
    jit.operation = "MULTIPLY_ADD"
    jit.inputs[1].default_value = 0.3
    jit.inputs[2].default_value = -0.15
    nt_.links.new(nz.outputs[0], jit.inputs[0])
    add = n_.new("ShaderNodeMath")
    add.operation = "ADD"
    nt_.links.new(sep.outputs[2], add.inputs[0])
    nt_.links.new(jit.outputs[0], add.inputs[1])
    ramp = n_.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.72
    ramp.color_ramp.elements[0].color = (*rock, 1)
    ramp.color_ramp.elements[1].position = 0.8
    ramp.color_ramp.elements[1].color = (*snow, 1)
    nt_.links.new(add.outputs[0], ramp.inputs[0])
    nt_.links.new(ramp.outputs[0], n_["Principled BSDF"].inputs["Base Color"])
    return m


def ice_mat(name="gelo"):
    # gelo azul: translúcido por dentro, com veios
    m = mat(name, (0.35, 0.55, 0.75), 0.18, 0.4)
    b = m.node_tree.nodes["Principled BSDF"]
    if "Subsurface Radius" in b.inputs:
        b.inputs["Subsurface Radius"].default_value = (0.4, 0.8, 1.6)
    if "Coat Weight" in b.inputs:
        b.inputs["Coat Weight"].default_value = 0.6
    n_ = m.node_tree.nodes
    w = n_.new("ShaderNodeTexWave")
    w.inputs["Scale"].default_value = 1.2
    w.inputs["Distortion"].default_value = 8
    r = n_.new("ShaderNodeValToRGB")
    r.color_ramp.elements[0].color = (0.22, 0.42, 0.62, 1)
    r.color_ramp.elements[1].color = (0.62, 0.8, 0.92, 1)
    m.node_tree.links.new(w.outputs[1], r.inputs[0])
    m.node_tree.links.new(r.outputs[0], b.inputs["Base Color"])
    return m


# ---------------------------------------------------------------- o chão de neve: ondulado, com sastrugi (cristas de vento)
bpy.ops.mesh.primitive_plane_add(size=260, location=(0, 60, 0))
g = bpy.context.object
g.name = "neve"
sub = g.modifiers.new("sub", "SUBSURF")
sub.subdivision_type = "SIMPLE"
sub.levels = sub.render_levels = 9
for nm, kind, size, strength in (("ond", "CLOUDS", 18.0, 0.3 if spec.get("ice_sheet") else 1.6), ("crista", "CLOUDS", 1.6, 0.18)):
    t = bpy.data.textures.new(nm, kind)
    t.noise_scale = size
    d = g.modifiers.new(nm, "DISPLACE")
    d.texture = t
    d.strength = strength
    d.mid_level = 0.5
nm_ = mat("neve", (0.8, 0.86, 0.95), 0.6, 0.12)
# relevo fino da neve (marcas de vento) só no sombreado
_n = nm_.node_tree.nodes
_tx = _n.new("ShaderNodeTexWave")
_tx.inputs["Scale"].default_value = 0.9
_tx.inputs["Distortion"].default_value = 14
_tx.inputs["Detail"].default_value = 6
_tn = _n.new("ShaderNodeTexNoise")
_tn.inputs["Scale"].default_value = 3.0
_tn.inputs["Detail"].default_value = 8
_mx = _n.new("ShaderNodeMath")
_mx.operation = "MULTIPLY_ADD"
_mx.inputs[1].default_value = 0.6
nm_.node_tree.links.new(_tx.outputs[1], _mx.inputs[0])
nm_.node_tree.links.new(_tn.outputs[0], _mx.inputs[2])
_bp = _n.new("ShaderNodeBump")
_bp.inputs["Strength"].default_value = 0.45
nm_.node_tree.links.new(_mx.outputs[0], _bp.inputs["Height"])
_cr = _n.new("ShaderNodeValToRGB")
_cr.color_ramp.elements[0].color = (0.62, 0.72, 0.86, 1)
_cr.color_ramp.elements[1].color = (0.9, 0.93, 0.98, 1)
nm_.node_tree.links.new(_mx.outputs[0], _cr.inputs[0])
nm_.node_tree.links.new(_cr.outputs[0], _n["Principled BSDF"].inputs["Base Color"])
if "Specular IOR Level" in _n["Principled BSDF"].inputs:
    _n["Principled BSDF"].inputs["Specular IOR Level"].default_value = 0.7
nm_.node_tree.links.new(_bp.outputs[0], _n["Principled BSDF"].inputs["Normal"])
g.data.materials.append(nm_)
bpy.ops.object.shade_smooth()

N_FR_ = spec.get("frames", 1)
# ---------------------------------------------------------------- morros e placas de gelo ao fundo
ice = ice_mat()
import random
random.seed(7)
# a cordilheira: um relevo de altura lá longe (morros com neve no alto, gelo azul na base)
for k, (y0, amp, sc_, seed) in enumerate(((230, 110, 60.0, 1), (150, 34, 26.0, 2))):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=400, y_subdivisions=60, size=1, location=(0, y0, -2))
    m_ = bpy.context.object
    m_.scale = (700, 90, 1)
    t1 = bpy.data.textures.new("serra%d" % k, "CLOUDS")
    t1.noise_scale = sc_
    t1.noise_depth = 6
    t1.noise_basis = "BLENDER_ORIGINAL"
    d = m_.modifiers.new("d", "DISPLACE")
    d.texture = t1
    d.texture_coords = "GLOBAL"
    d.strength = amp
    d.mid_level = 0.45
    m_.data.materials.append(slope_mat("serra%d" % k, (0.82, 0.87, 0.95) if k == 0 else (0.74, 0.82, 0.92)))
    bpy.ops.object.shade_smooth()
# cristas de pressão no meio do caminho: placas de gelo inclinadas em fila
crista = slope_mat("crista", (0.86, 0.9, 0.97), rock=(0.32, 0.5, 0.68))
for i in range(spec.get("ridges", 40)):
    x = random.uniform(-80, 80)
    y = random.uniform(30, 90)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=0.5, location=(x, y, -0.2))
    c = bpy.context.object
    c.scale = (random.uniform(2.5, 7), random.uniform(0.8, 1.8), random.uniform(0.7, 2.2))
    c.rotation_euler = (random.uniform(-0.25, 0.25), random.uniform(-0.2, 0.2), random.uniform(-0.4, 0.4))
    tb = bpy.data.textures.new("cr%d" % i, "VORONOI")
    tb.noise_scale = 0.45
    db = c.modifiers.new("d", "DISPLACE")
    db.texture = tb
    db.strength = 0.5
    dec = c.modifiers.new("dec", "DECIMATE")
    dec.ratio = 0.1
    c.data.materials.append(crista)
# blocos de gelo empilhados perto (dão escala)
for i in range(spec.get("blocks", 10)):
    x = random.uniform(-30, 30)
    y = random.uniform(6, 40)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=0.5, location=(x, y, 0.1))
    c = bpy.context.object
    c.scale = (random.uniform(0.8, 3.0), random.uniform(0.5, 1.8), random.uniform(0.4, 1.6))
    c.rotation_euler = (random.uniform(-0.5, 0.5), random.uniform(-0.6, 0.6), random.uniform(0, 3.14))
    tb = bpy.data.textures.new("b%d" % i, "VORONOI")
    tb.noise_scale = 0.35
    db = c.modifiers.new("d", "DISPLACE")
    db.texture = tb
    db.strength = 0.35
    dec = c.modifiers.new("dec", "DECIMATE")
    dec.ratio = 0.12
    c.data.materials.append(crista)

# ---------------------------------------------------------------- céu do entardecer polar + sol baixo + névoa
w = bpy.data.worlds.new("ceu")
sc.world = w
w.use_nodes = True
nt = w.node_tree
bg = nt.nodes["Background"]
az, el = spec.get("sun", [200, 4])
try:
    sky = nt.nodes.new("ShaderNodeTexSky")
    for t in ("MULTIPLE_SCATTERING", "NISHITA", "SINGLE_SCATTERING"):
        try:
            sky.sky_type = t
            break
        except Exception:
            pass
    sky.sun_elevation = math.radians(el)
    sky.sun_rotation = math.radians(az)
    if hasattr(sky, "air_density"):
        sky.air_density = 1.6
    nt.links.new(sky.outputs[0], bg.inputs[0])
    bg.inputs[1].default_value = spec.get("sky_strength", 0.55)
except Exception as e:
    print("sem sky", e)
    bg.inputs[0].default_value = (0.25, 0.35, 0.55, 1)
if spec.get("fog", 0) > 0:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 150, 12))
    fogc = bpy.context.object
    fogc.name = "nevoa"
    fogc.scale = (500, 320, 24)
    fm = bpy.data.materials.new("nevoa")
    fm.use_nodes = True
    fn = fm.node_tree.nodes
    fn.remove(fn["Principled BSDF"])
    vol = fn.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = spec["fog"]
    vol.inputs["Color"].default_value = (0.7, 0.78, 0.92, 1)
    fm.node_tree.links.new(vol.outputs[0], fn["Material Output"].inputs["Volume"])
    fogc.data.materials.append(fm)
if spec.get("ground_fog", 0) > 0:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 70, 1.5))
    gf = bpy.context.object
    gf.name = "nevoa_rasteira"
    gf.scale = (300, 170, 3.4)
    gm = bpy.data.materials.new("nevoa_rasteira")
    gm.use_nodes = True
    gn = gm.node_tree.nodes
    gn.remove(gn["Principled BSDF"])
    gv = gn.new("ShaderNodeVolumePrincipled")
    gv.inputs["Color"].default_value = (0.78, 0.84, 0.95, 1)
    tc = gn.new("ShaderNodeTexCoord")
    gr = gn.new("ShaderNodeSeparateXYZ")
    gm.node_tree.links.new(tc.outputs["Object"], gr.inputs[0])
    fall = gn.new("ShaderNodeMapRange")
    fall.inputs["From Min"].default_value = -0.5
    fall.inputs["From Max"].default_value = 0.5
    fall.inputs["To Min"].default_value = 1.0
    fall.inputs["To Max"].default_value = 0.0
    gm.node_tree.links.new(gr.outputs[2], fall.inputs["Value"])
    nz_ = gn.new("ShaderNodeTexNoise")
    nz_.inputs["Scale"].default_value = 9.0
    nz_.inputs["Detail"].default_value = 4
    gm.node_tree.links.new(tc.outputs["Generated"], nz_.inputs["Vector"])
    wisps = gn.new("ShaderNodeMapRange")
    wisps.inputs["From Min"].default_value = 0.42
    wisps.inputs["From Max"].default_value = 0.68
    gm.node_tree.links.new(nz_.outputs[0], wisps.inputs["Value"])
    m1 = gn.new("ShaderNodeMath")
    m1.operation = "MULTIPLY"
    gm.node_tree.links.new(fall.outputs[0], m1.inputs[0])
    gm.node_tree.links.new(wisps.outputs[0], m1.inputs[1])
    m2 = gn.new("ShaderNodeMath")
    m2.operation = "MULTIPLY"
    m2.inputs[1].default_value = spec["ground_fog"]
    gm.node_tree.links.new(m1.outputs[0], m2.inputs[0])
    gm.node_tree.links.new(m2.outputs[0], gv.inputs["Density"])
    gm.node_tree.links.new(gv.outputs[0], gn["Material Output"].inputs["Volume"])
    gf.data.materials.append(gm)
if spec.get("clouds", 0) > 0:
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 260, 95))
    cl = bpy.context.object
    cl.scale = (1400, 500, 1)
    cm = bpy.data.materials.new("nuvens")
    cm.use_nodes = True
    cn = cm.node_tree.nodes
    cn.remove(cn["Principled BSDF"])
    try:
        cm.surface_render_method = "BLENDED"
    except Exception:
        pass
    ns = cn.new("ShaderNodeTexNoise")
    ns.inputs["Scale"].default_value = 5.0
    ns.inputs["Detail"].default_value = 12
    ns.inputs["Roughness"].default_value = 0.62
    mr = cn.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = 0.5
    mr.inputs["From Max"].default_value = 0.72
    mr.inputs["To Max"].default_value = spec["clouds"]
    cm.node_tree.links.new(ns.outputs[0], mr.inputs["Value"])
    em_ = cn.new("ShaderNodeEmission")
    em_.inputs["Color"].default_value = (1.0, 0.68, 0.5, 1)
    em_.inputs["Strength"].default_value = spec.get("cloud_glow", 0.9)
    tr_ = cn.new("ShaderNodeBsdfTransparent")
    mix_ = cn.new("ShaderNodeMixShader")
    cm.node_tree.links.new(mr.outputs[0], mix_.inputs[0])
    cm.node_tree.links.new(tr_.outputs[0], mix_.inputs[1])
    cm.node_tree.links.new(em_.outputs[0], mix_.inputs[2])
    cm.node_tree.links.new(mix_.outputs[0], cn["Material Output"].inputs["Surface"])
    cl.data.materials.append(cm)
    cl.visible_shadow = False
if spec.get("aurora", 0) > 0:
    for k_, (y_, x0, ph) in enumerate(((420, -60, 0.0), (520, 90, 1.7))):
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=160, y_subdivisions=2, size=1, location=(x0, y_, 110))
        au = bpy.context.object
        au.scale = (1800, 150, 1)
        au.rotation_euler = (math.radians(90), 0, 0)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        for v in au.data.vertices:
            v.co.y += 60 * math.sin(v.co.x / 120 + ph) + 25 * math.sin(v.co.x / 37 + ph * 2)
        am = bpy.data.materials.new("aurora%d" % k_)
        am.use_nodes = True
        an = am.node_tree.nodes
        an.remove(an["Principled BSDF"])
        try:
            am.surface_render_method = "BLENDED"
        except Exception:
            pass
        tc_ = an.new("ShaderNodeTexCoord")
        sx = an.new("ShaderNodeSeparateXYZ")
        am.node_tree.links.new(tc_.outputs["Generated"], sx.inputs[0])
        # faixas verticais finas (raios da cortina)
        mp = an.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (60, 1.5, 1)
        am.node_tree.links.new(tc_.outputs["Generated"], mp.inputs["Vector"])
        nz = an.new("ShaderNodeTexNoise")
        nz.noise_dimensions = "4D"
        nz.inputs["Scale"].default_value = 1.6
        nz.inputs["Detail"].default_value = 3
        am.node_tree.links.new(mp.outputs[0], nz.inputs["Vector"])
        nz.inputs["W"].default_value = 0.0
        nz.inputs["W"].keyframe_insert("default_value", frame=1)
        nz.inputs["W"].default_value = N_FR_ / 300.0
        nz.inputs["W"].keyframe_insert("default_value", frame=max(2, N_FR_))
        st_ = an.new("ShaderNodeMapRange")
        st_.inputs["From Min"].default_value = 0.5
        st_.inputs["From Max"].default_value = 0.8
        am.node_tree.links.new(nz.outputs[0], st_.inputs["Value"])
        # forte embaixo, sumindo para cima; base bem marcada
        up = an.new("ShaderNodeValToRGB")
        up.color_ramp.elements[0].position = 0.0
        up.color_ramp.elements[0].color = (0, 0, 0, 1)
        up.color_ramp.elements.new(0.1).color = (1, 1, 1, 1)
        up.color_ramp.elements.new(0.45).color = (0.25, 0.25, 0.25, 1)
        up.color_ramp.elements[3].position = 0.85
        up.color_ramp.elements[3].color = (0, 0, 0, 1)
        am.node_tree.links.new(sx.outputs[2], up.inputs[0])
        col = an.new("ShaderNodeValToRGB")
        col.color_ramp.elements[0].position = 0.15
        col.color_ramp.elements[0].color = (0.15, 1.0, 0.55, 1)
        col.color_ramp.elements[1].position = 0.85
        col.color_ramp.elements[1].color = (0.75, 0.25, 0.9, 1)
        am.node_tree.links.new(sx.outputs[2], col.inputs[0])
        a1 = an.new("ShaderNodeMath"); a1.operation = "MULTIPLY"
        am.node_tree.links.new(st_.outputs[0], a1.inputs[0])
        am.node_tree.links.new(up.outputs[0], a1.inputs[1])
        ends = an.new("ShaderNodeValToRGB")
        ends.color_ramp.elements[0].position = 0.08
        ends.color_ramp.elements[0].color = (0, 0, 0, 1)
        ends.color_ramp.elements.new(0.3).color = (1, 1, 1, 1)
        ends.color_ramp.elements.new(0.7).color = (1, 1, 1, 1)
        ends.color_ramp.elements[3].position = 0.92
        ends.color_ramp.elements[3].color = (0, 0, 0, 1)
        am.node_tree.links.new(sx.outputs[0], ends.inputs[0])
        bl = an.new("ShaderNodeTexNoise")
        bl.inputs["Scale"].default_value = 3.0
        bl.inputs["Detail"].default_value = 1
        mpb = an.new("ShaderNodeMapping")
        mpb.inputs["Scale"].default_value = (1, 0.05, 0.05)
        am.node_tree.links.new(tc_.outputs["Generated"], mpb.inputs["Vector"])
        am.node_tree.links.new(mpb.outputs[0], bl.inputs["Vector"])
        blr = an.new("ShaderNodeMapRange")
        blr.inputs["From Min"].default_value = 0.45
        blr.inputs["From Max"].default_value = 0.62
        am.node_tree.links.new(bl.outputs[0], blr.inputs["Value"])
        e1 = an.new("ShaderNodeMath"); e1.operation = "MULTIPLY"
        am.node_tree.links.new(ends.outputs[0], e1.inputs[0])
        am.node_tree.links.new(blr.outputs[0], e1.inputs[1])
        a2 = an.new("ShaderNodeMath"); a2.operation = "MULTIPLY"
        am.node_tree.links.new(a1.outputs[0], a2.inputs[0])
        am.node_tree.links.new(e1.outputs[0], a2.inputs[1])
        em2 = an.new("ShaderNodeEmission")
        em2.inputs["Strength"].default_value = spec["aurora"]
        am.node_tree.links.new(col.outputs[0], em2.inputs["Color"])
        tr2 = an.new("ShaderNodeBsdfTransparent")
        mx2 = an.new("ShaderNodeMixShader")
        am.node_tree.links.new(a2.outputs[0], mx2.inputs[0])
        am.node_tree.links.new(tr2.outputs[0], mx2.inputs[1])
        am.node_tree.links.new(em2.outputs[0], mx2.inputs[2])
        am.node_tree.links.new(mx2.outputs[0], an["Material Output"].inputs["Surface"])
        au.data.materials.append(am)
        au.visible_shadow = False
sun = bpy.data.objects.new("sol", bpy.data.lights.new("sol", "SUN"))
sun.data.energy = spec.get("sun_energy", 3.2)
sun.data.color = (1.0, 0.72, 0.48)
sun.data.angle = math.radians(spec.get("sun_angle", 2))
if hasattr(sun.data, "shadow_maximum_resolution"):
    sun.data.shadow_maximum_resolution = 0.002
sun.rotation_euler = (math.radians(90 - el), 0, math.radians(az + 180))
sc.collection.objects.link(sun)


# ---------------------------------------------------------------- extras: Xen e o fim do mundo
def emit_mat(name, color, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n_ = m.node_tree.nodes
    n_.remove(n_["Principled BSDF"])
    e_ = n_.new("ShaderNodeEmission")
    e_.inputs["Color"].default_value = (*color, 1)
    e_.inputs["Strength"].default_value = strength
    m.node_tree.links.new(e_.outputs[0], n_["Material Output"].inputs["Surface"])
    return m


def ground_z(x, y):
    dg0 = bpy.context.evaluated_depsgraph_get()
    h = g.evaluated_get(dg0).ray_cast(g.matrix_world.inverted() @ V((x, y, 50)), V((0, 0, -1)))
    return (g.matrix_world @ h[1]).z if h[0] else 0.0


if spec.get("palette") == "xen":
    # o mundo dos Vortigaunts: chão de musgo, rocha violeta, céu esverdeado
    _cr.color_ramp.elements[0].color = (0.07, 0.13, 0.1, 1)
    _cr.color_ramp.elements[1].color = (0.22, 0.34, 0.24, 1)
    for nm2, top, rk in (("serra0", (0.3, 0.38, 0.3), (0.16, 0.1, 0.2)), ("serra1", (0.26, 0.36, 0.28), (0.18, 0.11, 0.22)), ("crista", (0.24, 0.34, 0.25), (0.22, 0.13, 0.26))):
        rr = next(n for n in bpy.data.materials[nm2].node_tree.nodes if n.type == "VALTORGB")
        rr.color_ramp.elements[0].color = (*rk, 1)
        rr.color_ramp.elements[1].color = (*top, 1)
    for nn_ in (n for n in nt.nodes if n.type == "TEX_SKY"):
        tint = nt.nodes.new("ShaderNodeMix")
        tint.data_type = "RGBA"
        tint.blend_type = "MULTIPLY"
        tint.inputs[0].default_value = 1.0
        nt.links.new(nn_.outputs[0], tint.inputs[6])
        tint.inputs[7].default_value = (*spec.get("sky_tint", (0.5, 1.0, 0.75)), 1)
        nt.links.new(tint.outputs[2], bg.inputs[0])
    sun.data.color = tuple(spec.get("sun_color", (0.85, 1.0, 0.7)))
xen_rock = mat("xen_rocha", (0.075, 0.05, 0.07), 0.85)
_xn = xen_rock.node_tree.nodes
_vn = _xn.new("ShaderNodeTexVoronoi")
_vn.feature = "DISTANCE_TO_EDGE"
_vn.inputs["Scale"].default_value = 1.6
_vr = _xn.new("ShaderNodeValToRGB")
_vr.color_ramp.elements[0].position = 0.0
_vr.color_ramp.elements[0].color = (0.45, 1.0, 0.6, 1)
_vr.color_ramp.elements[1].position = 0.025
_vr.color_ramp.elements[1].color = (0, 0, 0, 1)
xen_rock.node_tree.links.new(_vn.outputs["Distance"], _vr.inputs[0])
xen_rock.node_tree.links.new(_vr.outputs[0], _xn["Principled BSDF"].inputs["Emission Color"])
_xn["Principled BSDF"].inputs["Emission Strength"].default_value = spec.get("vein_glow", 3.0)
# ilhas de Xen no céu: [x, y, z, tamanho] (+ "rise": [q0, q1, metros] = sobem do chão até ali)
for i, isl in enumerate(spec.get("islands", [])):
    x, y, z, s = isl[:4]
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=1, location=(x, y, z))
    c = bpy.context.object
    c.scale = (s, s * random.uniform(0.7, 1.1), s * 0.45)
    c.rotation_euler = (0, 0, random.uniform(0, 6.28))
    # topo achatado, fundo em ponta (cone de rocha pendurado)
    for v in c.data.vertices:
        if v.co.z < 0:
            v.co.z *= 1.0 + 1.6 * (1 - (v.co.x ** 2 + v.co.y ** 2))
        else:
            v.co.z *= 0.35
    for k_, (kind_, ns_, st_) in enumerate((("VORONOI", 0.55, 0.4), ("CLOUDS", 0.22, 0.25))):
        tb = bpy.data.textures.new("isl%d_%d" % (i, k_), kind_)
        tb.noise_scale = ns_
        db = c.modifiers.new("d%d" % k_, "DISPLACE")
        db.texture = tb
        db.strength = st_
    dec = c.modifiers.new("dec", "DECIMATE")
    dec.ratio = 0.5
    c.data.materials.append(xen_rock)
    if spec.get("rise"):
        q0, q1, dz = spec["rise"]
        c.location.z = z - dz
        c.keyframe_insert("location", frame=q0)
        c.location.z = z
        c.keyframe_insert("location", frame=q1)
    # 03/11 (pedido dele: "as pedras subindo não existem"): as ilhas sobem de verdade, cada uma no seu ritmo, girando
    # devagar e soltando pedaços por baixo. isl[4] = {"emerge": [q0, q1, dz]} = sai de baixo do gelo até a altura dada
    im = spec.get("isl_move")
    ex = isl[4] if len(isl) > 4 and isinstance(isl[4], dict) else {}
    if im or ex:
        _prefs = bpy.context.preferences.edit
        _old_it = _prefs.keyframe_new_interpolation_type
        _prefs.keyframe_new_interpolation_type = "LINEAR"
        rr = random.Random(1000 + i)
        spd = rr.uniform(*im.get("spd", [0.3, 0.8])) if im else 0
        spin = math.radians(rr.uniform(-1, 1) * (im.get("spin", 1.5) if im else 0))
        fps_ = spec.get("fps", 30)
        rz0 = c.rotation_euler.z
        if ex.get("emerge"):
            q0, q1, dz = ex["emerge"]
            _prefs.keyframe_new_interpolation_type = "BEZIER"
            c.location.z = z - dz
            c.keyframe_insert("location", frame=1)
            c.keyframe_insert("location", frame=q0)
            c.location.z = z
            c.keyframe_insert("location", frame=q1)
            _prefs.keyframe_new_interpolation_type = "LINEAR"
            c.location.z = z + spd * (N_FR_ - q1) / fps_
            c.keyframe_insert("location", frame=max(N_FR_, q1 + 1))
        else:
            c.location.z = z
            c.keyframe_insert("location", frame=1)
            c.location.z = z + spd * N_FR_ / fps_
            c.keyframe_insert("location", frame=N_FR_)
        c.rotation_euler = (0, 0, rz0)
        c.keyframe_insert("rotation_euler", frame=1)
        c.rotation_euler = (rr.uniform(-0.01, 0.01) * N_FR_ / fps_, rr.uniform(-0.01, 0.01) * N_FR_ / fps_, rz0 + spin * N_FR_ / fps_)
        c.keyframe_insert("rotation_euler", frame=max(N_FR_, 2))
        # pedaços caindo de baixo da ilha (queda livre, nascem em tempos espalhados e somem no chão)
        nd = int((im or {}).get("debris", 0) * (s / 20.0) ** 0.5) + (int(ex.get("debris", 0)))

        def _isl_z(fr_):
            if ex.get("emerge"):
                q0, q1, dz = ex["emerge"]
                if fr_ <= q0:
                    return z - dz
                if fr_ < q1:
                    u = (fr_ - q0) / (q1 - q0)
                    return z - dz + dz * u * u * (3 - 2 * u)
                return z + spd * (fr_ - q1) / fps_
            return z + spd * fr_ / fps_
        t_min = ex["emerge"][0] + 0.4 * (ex["emerge"][1] - ex["emerge"][0]) if ex.get("emerge") else -40
        for d_ in range(nd):
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1)
            ch = bpy.context.object
            r_ = rr.uniform(0.15, 0.6) * max(1.0, s / 25.0)
            ch.scale = (r_, r_ * rr.uniform(0.6, 1.2), r_ * rr.uniform(0.5, 1.0))
            ch.data.materials.append(xen_rock)
            t0 = rr.uniform(t_min, N_FR_)
            ox, oy = rr.uniform(-0.5, 0.5) * s, rr.uniform(-0.5, 0.5) * s * 0.8
            zs_ = _isl_z(max(1, t0)) - s * 0.5
            for fr_ in range(int(max(1, t0)), int(N_FR_) + 1, 3):
                tt = (fr_ - t0) / fps_
                zi = zs_ - 4.9 * tt * tt
                ch.location = (x + ox, y + oy, zi)
                ch.rotation_euler = (tt * 3, tt * 2, tt)
                ch.keyframe_insert("location", frame=fr_)
                ch.keyframe_insert("rotation_euler", frame=fr_)
                if zi < -2:
                    break
            ch.hide_render = True
            ch.keyframe_insert("hide_render", frame=1)
            ch.hide_render = False
            ch.keyframe_insert("hide_render", frame=int(max(1, t0)))
            ch.hide_render = True
            ch.keyframe_insert("hide_render", frame=fr_ + 1)
        _prefs.keyframe_new_interpolation_type = _old_it
# rachaduras com luz no chão: [x1, y1, x2, y2, largura] (a faixa acompanha o relevo)
crack_m = bpy.data.materials.new("fenda")
crack_m.use_nodes = True
_fn = crack_m.node_tree.nodes
_fn.remove(_fn["Principled BSDF"])
_uv = _fn.new("ShaderNodeUVMap")
_sx = _fn.new("ShaderNodeSeparateXYZ")
crack_m.node_tree.links.new(_uv.outputs[0], _sx.inputs[0])
_ab = _fn.new("ShaderNodeMath")
_ab.operation = "SUBTRACT"
_ab.inputs[1].default_value = 0.5
crack_m.node_tree.links.new(_sx.outputs[0], _ab.inputs[0])
_ab2 = _fn.new("ShaderNodeMath")
_ab2.operation = "ABSOLUTE"
crack_m.node_tree.links.new(_ab.outputs[0], _ab2.inputs[0])
_fr = _fn.new("ShaderNodeValToRGB")  # 0 = centro da fenda, 0.5 = borda do brilho
_fr.color_ramp.elements[0].position = 0.04
_fr.color_ramp.elements[0].color = (1, 1, 1, 1)
_fr.color_ramp.elements.new(0.1).color = (0.35, 0.35, 0.35, 1)
_fr.color_ramp.elements[2].position = 0.5
_fr.color_ramp.elements[2].color = (0, 0, 0, 1)
crack_m.node_tree.links.new(_ab2.outputs[0], _fr.inputs[0])
_em = _fn.new("ShaderNodeEmission")
_em.inputs["Color"].default_value = (*spec.get("crack_color", (1.0, 0.7, 0.35)), 1)
_ms = _fn.new("ShaderNodeMath")
_ms.operation = "MULTIPLY"
_ms.inputs[1].default_value = spec.get("crack_glow", 6.0)
crack_m.node_tree.links.new(_fr.outputs[0], _ms.inputs[0])
crack_m.node_tree.links.new(_ms.outputs[0], _em.inputs["Strength"])
_tr = _fn.new("ShaderNodeBsdfTransparent")
_mx = _fn.new("ShaderNodeMixShader")
_al = _fn.new("ShaderNodeMath")
_al.operation = "POWER"
_al.inputs[1].default_value = 0.6
crack_m.node_tree.links.new(_fr.outputs[0], _al.inputs[0])
crack_m.node_tree.links.new(_al.outputs[0], _mx.inputs[0])
crack_m.node_tree.links.new(_tr.outputs[0], _mx.inputs[1])
crack_m.node_tree.links.new(_em.outputs[0], _mx.inputs[2])
crack_m.node_tree.links.new(_mx.outputs[0], _fn["Material Output"].inputs["Surface"])
try:
    crack_m.surface_render_method = "BLENDED"
except Exception:
    pass


def crack(name, x1, y1, x2, y2, wd, seed, depth=0):
    rng = random.Random(seed)
    n_seg = max(8, int(math.hypot(x2 - x1, y2 - y1) * 1.5))
    vs, fs, uvs = [], [], []
    dx_, dy_ = x2 - x1, y2 - y1
    L_ = math.hypot(dx_, dy_) or 1
    px_, py_ = -dy_ / L_, dx_ / L_
    off = 0.0
    pts_ = []
    for k in range(n_seg + 1):
        t_ = k / n_seg
        off += rng.uniform(-1, 1) * L_ / n_seg * 0.9
        cx_, cy_ = x1 + dx_ * t_ + px_ * off, y1 + dy_ * t_ + py_ * off
        pts_.append((cx_, cy_))
        # a faixa inclui o brilho em volta do núcleo
        hw = wd * (0.25 + 0.75 * math.sin(math.pi * min(1, t_ * 1.2))) * rng.uniform(0.6, 1.3) * 2.2
        for u_, sgn in ((0.0, -1), (0.5, 0), (1.0, 1)):
            xx, yy = cx_ + px_ * hw * sgn, cy_ + py_ * hw * sgn
            vs.append((xx, yy, ground_z(xx, yy) + 0.03 + 0.01 * depth))
            uvs.append((u_, t_))
        if k:
            b_ = 3 * k
            fs += [(b_ - 3, b_ - 2, b_ + 1, b_), (b_ - 2, b_ - 1, b_ + 2, b_ + 1)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(vs, [], fs)
    uvl = me.uv_layers.new(name="UVMap")
    for poly in me.polygons:
        for li in poly.loop_indices:
            uvl.data[li].uv = uvs[me.loops[li].vertex_index]
    ob = bpy.data.objects.new(name, me)
    sc.collection.objects.link(ob)
    ob.data.materials.append(crack_m)
    ob.visible_shadow = False
    # galhos: rachaduras menores saindo de lado
    if depth < 2:
        for j in range(rng.randint(2, 4) if depth == 0 else rng.randint(0, 2)):
            bx, by = pts_[rng.randint(1, len(pts_) - 2)]
            ang = math.atan2(dy_, dx_) + rng.choice((-1, 1)) * rng.uniform(0.5, 1.2)
            ln = L_ * rng.uniform(0.15, 0.35)
            crack(name + "_%d" % j, bx, by, bx + math.cos(ang) * ln, by + math.sin(ang) * ln, wd * 0.45, seed * 7 + j, depth + 1)


for i, (x1, y1, x2, y2, wd) in enumerate(spec.get("cracks", [])):
    crack("fenda%d" % i, x1, y1, x2, y2, wd, 100 + i)
# plantas de Xen que brilham: [x, y, altura]
stalk_m = mat("talo", (0.03, 0.08, 0.045), 0.6)
bulb_m = emit_mat("bulbo", tuple(spec.get("bulb_color", (0.45, 1.0, 0.75))), spec.get("bulb_glow", 3.0))
for i, (x, y, h_) in enumerate(spec.get("plants", [])):
    z0 = ground_z(x, y)
    for k_ in range(random.randint(1, 3)):
        hh = h_ * random.uniform(0.6, 1.0)
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.022 * hh, radius2=0.006 * hh, depth=hh, location=(x, y, z0 + hh / 2))
        st = bpy.context.object
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.subdivide(number_cuts=10)
        bpy.ops.object.mode_set(mode="OBJECT")
        bd = st.modifiers.new("curva", "SIMPLE_DEFORM")
        bd.deform_method = "BEND"
        bd.deform_axis = "X"
        bd.angle = random.uniform(0.3, 1.1) * random.choice((-1, 1))
        st.rotation_euler = (0, 0, random.uniform(0, 6.28))
        st.data.materials.append(stalk_m)
        bpy.context.view_layer.update()
        dgp = bpy.context.evaluated_depsgraph_get()
        ev_ = st.evaluated_get(dgp).to_mesh()
        top = max((st.matrix_world @ v.co for v in ev_.vertices), key=lambda q: q.z)
        st.evaluated_get(dgp).to_mesh_clear()
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.035 * hh * random.uniform(0.7, 1.3), location=top)
        bl_ = bpy.context.object
        bl_.scale.z = 1.4
        bl_.data.materials.append(bulb_m)
# luzes pontuais: [x, y, z, r, g, b, watts]
for i, (x, y, z, r_, g_, b_, en) in enumerate(spec.get("lights", [])):
    L = bpy.data.objects.new("luz%d" % i, bpy.data.lights.new("luz%d" % i, "POINT"))
    L.data.energy = en
    L.data.color = (r_, g_, b_)
    L.data.shadow_soft_size = 0.5
    L.location = (x, y, z)
    sc.collection.objects.link(L)

# portal do Borealis: anel de luz em pé com a superfície ondulando no meio
# "portal": [x, y, z, raio, rotação_z]
if spec.get("portal"):
    px_, py_, pz_, pr_, prz = spec["portal"]
    ring_m = emit_mat("portal_anel", (0.45, 0.75, 1.0), 6.0)
    bpy.ops.mesh.primitive_torus_add(major_radius=pr_, minor_radius=pr_ * 0.015, major_segments=96, minor_segments=12, location=(px_, py_, pz_))
    rg_ = bpy.context.object
    rg_.rotation_euler = (math.radians(90), 0, math.radians(prz))
    rg_.scale = (1, 1.3, 1)
    rg_.data.materials.append(ring_m)
    rg_.visible_shadow = False
    sm_ = bpy.data.materials.new("portal_meio")
    sm_.use_nodes = True
    nn_ = sm_.node_tree.nodes
    nn_.remove(nn_["Principled BSDF"])
    tc_ = nn_.new("ShaderNodeTexCoord")
    wv_ = nn_.new("ShaderNodeTexNoise")
    wv_.inputs["Scale"].default_value = 2.2
    wv_.inputs["Detail"].default_value = 8
    wv_.inputs["Distortion"].default_value = 2.5
    wv_.noise_dimensions = "4D"
    wv_.inputs["W"].default_value = 0.0
    wv_.inputs["W"].keyframe_insert("default_value", frame=1)
    wv_.inputs["W"].default_value = N_FR_ * 0.02
    wv_.inputs["W"].keyframe_insert("default_value", frame=N_FR_)
    sm_.node_tree.links.new(tc_.outputs["Generated"], wv_.inputs["Vector"])
    cr_ = nn_.new("ShaderNodeValToRGB")
    cr_.color_ramp.elements[0].position = 0.4
    cr_.color_ramp.elements[0].color = tuple(spec.get("portal_deep", (0.04, 0.12, 0.28))) + (1,)
    cr_.color_ramp.elements[1].position = 0.8
    cr_.color_ramp.elements[1].color = (0.55, 0.82, 1.0, 1)
    sm_.node_tree.links.new(wv_.outputs[0], cr_.inputs[0])
    em_ = nn_.new("ShaderNodeEmission")
    em_.inputs["Strength"].default_value = 3.0
    sm_.node_tree.links.new(cr_.outputs[0], em_.inputs["Color"])
    tr_ = nn_.new("ShaderNodeBsdfTransparent")
    mx_ = nn_.new("ShaderNodeMixShader")
    mx_.inputs[0].default_value = spec.get("portal_opacity", 0.55)
    sm_.node_tree.links.new(tr_.outputs[0], mx_.inputs[1])
    sm_.node_tree.links.new(em_.outputs[0], mx_.inputs[2])
    sm_.node_tree.links.new(mx_.outputs[0], nn_["Material Output"].inputs["Surface"])
    sm_.surface_render_method = "BLENDED"
    bpy.ops.mesh.primitive_circle_add(vertices=96, radius=pr_ * 0.98, fill_type="NGON", location=(px_, py_, pz_))
    dk_ = bpy.context.object
    dk_.rotation_euler = (math.radians(90), 0, math.radians(prz))
    dk_.scale = (1, 1.3, 1)
    dk_.data.materials.append(sm_)
    dk_.visible_shadow = False
    pl_ = bpy.data.objects.new("portal_luz", bpy.data.lights.new("portal_luz", "POINT"))
    pl_.data.energy = 400
    pl_.data.color = (0.6, 0.85, 1.0)
    pl_.data.shadow_soft_size = pr_
    pl_.location = (px_, py_ - 0.4, pz_)
    sc.collection.objects.link(pl_)
    if spec.get("portal_open"):
        # o portal nasce de um ponto e cresce até o tamanho cheio entre os quadros [f0, f1]
        f0_, f1_ = spec["portal_open"]
        for o_ in (rg_, dk_):
            o_.scale = (0.001, 0.0013, 0.001)
            o_.keyframe_insert("scale", frame=f0_)
            o_.scale = (1, 1.3, 1)
            o_.keyframe_insert("scale", frame=f1_)
        pl_.data.energy = 0
        pl_.data.keyframe_insert("energy", frame=f0_)
        pl_.data.energy = 400
        pl_.data.keyframe_insert("energy", frame=f1_)

# portal da Aperture (igual ao do Portal): oval chapado na parede, borda de fogo azul/laranja com as texturas do jogo
# (portal-*-color-dx8 = cor + anel, portal_mask = buraco, noise-blur = tremor da borda) e o outro lado aparecendo dentro
# "portal_ap": {"pos": [x, y, z centro], "h": altura, "rot": graus z, "color": "blue"|"orange", "view": png do outro lado,
#               "crop": [u0, v0, u1, v1], "open": [f0, f1]}
if spec.get("portal_ap"):
    pa = spec["portal_ap"]
    TX_ = spec.get("portal_tex", "")
    ph_ = pa.get("h", 2.4)
    bpy.ops.mesh.primitive_plane_add(size=1, location=tuple(pa["pos"]))
    po_ = bpy.context.object
    po_.name = "portal_ap"
    po_.rotation_euler = (math.radians(90), 0, math.radians(pa.get("rot", 0)))
    po_.scale = (ph_ * 0.58 * 1.12, ph_ * 1.12, 1)
    pm_ = bpy.data.materials.new("portal_ap")
    pm_.use_nodes = True
    pnt_ = pm_.node_tree
    pnn_ = pnt_.nodes
    pnn_.remove(pnn_["Principled BSDF"])
    L_ = pnt_.links.new
    def img_(path, extend=True):
        t_ = pnn_.new("ShaderNodeTexImage")
        t_.image = bpy.data.images.load(path, check_existing=True)
        t_.extension = "EXTEND" if extend else "REPEAT"
        return t_
    uv_ = pnn_.new("ShaderNodeTexCoord")
    # tremor da borda: o ruído do jogo correndo no tempo empurra o UV
    pnm_ = pnn_.new("ShaderNodeMapping")
    L_(uv_.outputs["UV"], pnm_.inputs["Vector"])
    pnm_.inputs["Location"].default_value = (0, 0, 0)
    pnm_.inputs["Location"].keyframe_insert("default_value", frame=1)
    pnm_.inputs["Location"].default_value = (N_FR_ * 0.004, N_FR_ * 0.011, 0)
    pnm_.inputs["Location"].keyframe_insert("default_value", frame=N_FR_)
    nz_ = img_(TX_ + "noise-blur-256x256.png", False)
    L_(pnm_.outputs[0], nz_.inputs["Vector"])
    nz2_ = img_(TX_ + "noise-blur-256x256.png", False)
    nm2_ = pnn_.new("ShaderNodeMapping")
    L_(uv_.outputs["UV"], nm2_.inputs["Vector"])
    nm2_.inputs["Scale"].default_value = (0.6, 0.6, 1)
    nm2_.inputs["Location"].default_value = (0.3, 0, 0)
    nm2_.inputs["Location"].keyframe_insert("default_value", frame=1)
    nm2_.inputs["Location"].default_value = (0.3 - N_FR_ * 0.006, -N_FR_ * 0.008, 0)
    nm2_.inputs["Location"].keyframe_insert("default_value", frame=N_FR_)
    L_(nm2_.outputs[0], nz2_.inputs["Vector"])
    nsum_ = pnn_.new("ShaderNodeMix")
    nsum_.data_type = "RGBA"
    nsum_.inputs[0].default_value = 0.5
    L_(nz_.outputs["Color"], nsum_.inputs[6])
    L_(nz2_.outputs["Color"], nsum_.inputs[7])
    off_ = pnn_.new("ShaderNodeVectorMath")
    off_.operation = "MULTIPLY_ADD"
    off_.inputs[1].default_value = (0.06, 0.06, 0)
    off_.inputs[2].default_value = (-0.03, -0.03, 0)
    L_(nsum_.outputs[2], off_.inputs[0])
    # o portal fica um pouco maior que a máscara para o fogo poder passar da borda
    psh_ = pnn_.new("ShaderNodeMapping")
    psh_.inputs["Location"].default_value = (-0.054, -0.054, 0)
    psh_.inputs["Scale"].default_value = (1.12, 1.12, 1)
    L_(uv_.outputs["UV"], psh_.inputs["Vector"])
    uvd_ = pnn_.new("ShaderNodeVectorMath")
    uvd_.operation = "ADD"
    L_(psh_.outputs[0], uvd_.inputs[0])
    L_(off_.outputs[0], uvd_.inputs[1])
    col_ = img_(TX_ + "portal-%s-color-dx8.png" % pa.get("color", "blue"))
    L_(uvd_.outputs[0], col_.inputs["Vector"])
    hole_ = img_(TX_ + "portal_mask.png")
    L_(psh_.outputs[0], hole_.inputs["Vector"])
    # o outro lado (recorte da imagem), só dentro do buraco
    c0 = pa.get("crop", [0, 0, 1, 1])
    vm_ = pnn_.new("ShaderNodeMapping")
    vm_.inputs["Location"].default_value = (c0[0], c0[1], 0)
    vm_.inputs["Scale"].default_value = (c0[2] - c0[0], c0[3] - c0[1], 1)
    L_(psh_.outputs[0], vm_.inputs["Vector"])
    vw_ = img_(pa["view"])
    L_(vm_.outputs[0], vw_.inputs["Vector"])
    # brilho do anel (o alfa da textura de cor é o anel) com um pulsar do ruído
    ring_ = pnn_.new("ShaderNodeMath")
    ring_.operation = "MULTIPLY"
    L_(col_.outputs["Alpha"], ring_.inputs[0])
    fl_ = pnn_.new("ShaderNodeMath")
    fl_.operation = "MULTIPLY_ADD"
    fl_.inputs[1].default_value = 1.2
    fl_.inputs[2].default_value = 0.4
    L_(nz2_.outputs["Color"], fl_.inputs[0])
    L_(fl_.outputs[0], ring_.inputs[1])
    rgl_ = pnn_.new("ShaderNodeMath")
    rgl_.operation = "MINIMUM"
    rgl_.inputs[1].default_value = 1.0
    L_(ring_.outputs[0], rgl_.inputs[0])
    vem_ = pnn_.new("ShaderNodeEmission")
    vem_.inputs["Strength"].default_value = pa.get("view_glow", 1.0)
    L_(vw_.outputs["Color"], vem_.inputs["Color"])
    rem_ = pnn_.new("ShaderNodeEmission")
    rem_.inputs["Strength"].default_value = pa.get("glow", 12.0)
    L_(col_.outputs["Color"], rem_.inputs["Color"])
    mxr_ = pnn_.new("ShaderNodeMixShader")
    L_(rgl_.outputs[0], mxr_.inputs[0])
    L_(vem_.outputs[0], mxr_.inputs[1])
    L_(rem_.outputs[0], mxr_.inputs[2])
    al_ = pnn_.new("ShaderNodeMath")
    al_.operation = "MAXIMUM"
    L_(hole_.outputs["Alpha"], al_.inputs[0])
    L_(rgl_.outputs[0], al_.inputs[1])
    ptr_ = pnn_.new("ShaderNodeBsdfTransparent")
    mxa_ = pnn_.new("ShaderNodeMixShader")
    L_(al_.outputs[0], mxa_.inputs[0])
    L_(ptr_.outputs[0], mxa_.inputs[1])
    L_(mxr_.outputs[0], mxa_.inputs[2])
    L_(mxa_.outputs[0], pnn_["Material Output"].inputs["Surface"])
    pm_.surface_render_method = "BLENDED"
    po_.data.materials.append(pm_)
    po_.visible_shadow = False
    lc_ = (0.25, 0.55, 1.0) if pa.get("color", "blue") == "blue" else (1.0, 0.5, 0.1)
    pl_ = bpy.data.objects.new("portal_ap_luz", bpy.data.lights.new("portal_ap_luz", "AREA"))
    pl_.data.shape = "ELLIPSE"
    pl_.data.size, pl_.data.size_y = ph_ * 0.58, ph_
    pl_.data.energy = pa.get("light", 300)
    pl_.data.color = lc_
    pl_.location = po_.location + V((0, -0.05, 0))
    pl_.rotation_euler = (math.radians(-90), 0, math.radians(pa.get("rot", 0)))
    sc.collection.objects.link(pl_)
    if pa.get("open"):
        f0_, f1_ = pa["open"]
        sx_ = po_.scale.copy()
        po_.scale = (sx_.x * 0.02, sx_.y * 0.02, 1)
        po_.keyframe_insert("scale", frame=f0_)
        po_.scale = (sx_.x * 1.08, sx_.y * 1.08, 1)
        po_.keyframe_insert("scale", frame=f0_ + int((f1_ - f0_) * 0.7))
        po_.scale = sx_
        po_.keyframe_insert("scale", frame=f1_)
        e0_ = pl_.data.energy
        pl_.data.energy = 0
        pl_.data.keyframe_insert("energy", frame=f0_)
        pl_.data.energy = e0_
        pl_.data.keyframe_insert("energy", frame=f1_)

# a energia verde dos Vortigaunts: raios em zigue-zague em volta de um ponto
# "vort_arcs": [x, y, z, raio, quantidade]
if spec.get("vort_arcs"):
    ax_, ay_, az_, ar_, an_ = spec["vort_arcs"]
    arc_m = emit_mat("vort_raio", (0.2, 1.0, 0.35), spec.get("arc_glow", 12.0))
    rng_a = random.Random(21)
    for k_ in range(int(an_)):
        # só nas laterais e embaixo da visão (o centro fica livre): ângulos fora do cone da frente (+Y)
        a0 = rng_a.uniform(0, 6.28)
        e0 = rng_a.uniform(-0.35, 0.25)
        pts_ = []
        for q in range(22):
            a1 = a0 + q * rng_a.uniform(0.015, 0.04)
            e1 = e0 + rng_a.uniform(-0.05, 0.05)
            r1 = ar_ * rng_a.uniform(0.9, 1.1)
            pts_.append((ax_ + math.cos(a1) * math.cos(e1) * r1, ay_ + math.sin(a1) * math.cos(e1) * r1, az_ + math.sin(e1) * r1))
        cu = bpy.data.curves.new("raio%d" % k_, "CURVE")
        cu.dimensions = "3D"
        cu.bevel_depth = rng_a.uniform(0.0015, 0.004)
        sp_ = cu.splines.new("POLY")
        sp_.points.add(len(pts_) - 1)
        for q, pp in enumerate(pts_):
            sp_.points[q].co = (*pp, 1)
        ob_ = bpy.data.objects.new("raio%d" % k_, cu)
        sc.collection.objects.link(ob_)
        ob_.data.materials.append(arc_m)
        ob_.visible_shadow = False
    if N_FR_ > 1:
        # cada raio liga e desliga em tempos diferentes, como a energia dos Vortigaunts
        for k_ in range(int(an_)):
            ob_ = bpy.data.objects["raio%d" % k_]
            on_ = rng_a.random() < 0.6
            for f_ in range(1, N_FR_ + 1, 3):
                if rng_a.random() < 0.35:
                    on_ = not on_
                ob_.hide_render = not on_
                ob_.keyframe_insert("hide_render", frame=f_)
    gl_ = bpy.data.objects.new("vort_luz", bpy.data.lights.new("vort_luz", "POINT"))
    gl_.data.energy = spec.get("arc_light", 300)
    if N_FR_ > 1:
        for f_ in range(1, N_FR_ + 1, 3):
            gl_.data.energy = spec.get("arc_light", 300) * rng_a.uniform(0.55, 1.15) * (1 + spec.get("arc_ramp", 0.0) * (f_ / N_FR_))
            gl_.data.keyframe_insert("energy", frame=f_)
    gl_.data.color = (0.45, 1.0, 0.55)
    gl_.data.shadow_soft_size = ar_
    gl_.location = (ax_, ay_, az_)
    sc.collection.objects.link(gl_)

def tex_node(nt_, path, scale, seed=0.0):
    # imagem do jogo repetida no chão em coordenadas do mundo (escala = metros por repetição)
    n_ = nt_.nodes
    tc = n_.new("ShaderNodeTexCoord")
    mp = n_.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / scale, 1 / scale, 1 / scale)
    mp.inputs["Rotation"].default_value = (0, 0, seed)
    nt_.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    ti = n_.new("ShaderNodeTexImage")
    ti.image = bpy.data.images.load(path, check_existing=True)
    ti.projection = "BOX"
    ti.projection_blend = 0.3
    nt_.links.new(mp.outputs[0], ti.inputs["Vector"])
    return ti


def textured(m, gt):
    # troca a cor do material pela mistura de duas texturas do jogo (manchas grandes quebram a repetição),
    # com relevo tirado da própria imagem e um tom por cima
    nt_ = m.node_tree
    n_ = nt_.nodes
    bs = n_["Principled BSDF"]
    a_ = tex_node(nt_, gt["a"], gt.get("scale", 4.0))
    b_ = tex_node(nt_, gt.get("b", gt["a"]), gt.get("scale", 4.0) * 1.7, 0.7)
    nz = n_.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = gt.get("patch", 0.05)
    nz.inputs["Detail"].default_value = 4
    tcw = n_.new("ShaderNodeTexCoord")
    nt_.links.new(tcw.outputs["Object"], nz.inputs["Vector"])
    mr = n_.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = 0.42
    mr.inputs["From Max"].default_value = 0.58
    nt_.links.new(nz.outputs[0], mr.inputs["Value"])
    mx = n_.new("ShaderNodeMix")
    mx.data_type = "RGBA"
    nt_.links.new(mr.outputs[0], mx.inputs[0])
    nt_.links.new(a_.outputs["Color"], mx.inputs[6])
    nt_.links.new(b_.outputs["Color"], mx.inputs[7])
    tn = n_.new("ShaderNodeMix")
    tn.data_type = "RGBA"
    tn.blend_type = "MULTIPLY"
    tn.inputs[0].default_value = 1.0
    tn.inputs[7].default_value = (*gt.get("tint", (1, 1, 1)), 1)
    nt_.links.new(mx.outputs[2], tn.inputs[6])
    nt_.links.new(tn.outputs[2], bs.inputs["Base Color"])
    bw = n_.new("ShaderNodeRGBToBW")
    nt_.links.new(mx.outputs[2], bw.inputs[0])
    bp = n_.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = gt.get("bump", 0.35)
    bp.inputs["Distance"].default_value = 0.05
    nt_.links.new(bw.outputs[0], bp.inputs["Height"])
    nt_.links.new(bp.outputs[0], bs.inputs["Normal"])
    bs.inputs["Roughness"].default_value = gt.get("rough", 0.7)


if spec.get("ground_tex"):
    textured(nm_, spec["ground_tex"])
    for nm2 in ("crista",):
        if spec.get("ridge_tex"):
            textured(bpy.data.materials[nm2], spec["ridge_tex"])

# placas de gelo levantando ao longo das rachaduras: [n por fenda, inclinação mín, máx (graus)]
if spec.get("slabs") and spec.get("cracks"):
    n_per, tmin, tmax = spec["slabs"]
    slab_m = ice_mat("placa")
    if spec.get("ground_tex"):
        # topo com a mesma neve do chão, lado de gelo azul (pelo ângulo da face)
        textured(slab_m, dict(spec["ground_tex"], bump=0.2))
        n_ = slab_m.node_tree.nodes
        bs = n_["Principled BSDF"]
        tinted = bs.inputs["Base Color"].links[0].from_socket
        gm_ = n_.new("ShaderNodeNewGeometry")
        sz = n_.new("ShaderNodeSeparateXYZ")
        slab_m.node_tree.links.new(gm_.outputs["Normal"], sz.inputs[0])
        rp = n_.new("ShaderNodeMapRange")
        rp.inputs["From Min"].default_value = 0.45
        rp.inputs["From Max"].default_value = 0.7
        slab_m.node_tree.links.new(sz.outputs[2], rp.inputs["Value"])
        side = n_.new("ShaderNodeTexWave")
        side.inputs["Scale"].default_value = 3.0
        side.inputs["Distortion"].default_value = 6
        sr = n_.new("ShaderNodeValToRGB")
        sr.color_ramp.elements[0].color = (0.12, 0.3, 0.45, 1)
        sr.color_ramp.elements[1].color = (0.45, 0.7, 0.85, 1)
        slab_m.node_tree.links.new(side.outputs[1], sr.inputs[0])
        mm = n_.new("ShaderNodeMix")
        mm.data_type = "RGBA"
        slab_m.node_tree.links.new(rp.outputs[0], mm.inputs[0])
        slab_m.node_tree.links.new(sr.outputs[0], mm.inputs[6])
        slab_m.node_tree.links.new(tinted, mm.inputs[7])
        slab_m.node_tree.links.new(mm.outputs[2], bs.inputs["Base Color"])
    rng = random.Random(11)
    for ci, (x1, y1, x2, y2, wd) in enumerate(spec["cracks"]):
        dx_, dy_ = x2 - x1, y2 - y1
        L_ = math.hypot(dx_, dy_) or 1
        ux, uy = dx_ / L_, dy_ / L_
        for j in range(n_per):
            t_ = (j + rng.uniform(0.2, 0.8)) / n_per
            for sgn in (-1, 1):
                if rng.random() < 0.3:
                    continue
                ln = rng.uniform(1.6, 4.0) * (1 + t_)
                wdt = rng.uniform(1.2, 2.6) * (1 + t_ * 0.6)
                cx_ = x1 + dx_ * t_ - uy * sgn * (wd * 0.4 + wdt / 2)
                cy_ = y1 + dy_ * t_ + ux * sgn * (wd * 0.4 + wdt / 2)
                bpy.ops.mesh.primitive_cube_add(size=1, location=(cx_, cy_, 0))
                sl = bpy.context.object
                sl.scale = (ln, wdt, rng.uniform(0.25, 0.5))
                bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
                bv = sl.modifiers.new("bv", "BEVEL")
                bv.width = 0.04
                bv.segments = 2
                sb = sl.modifiers.new("sub", "SUBSURF")
                sb.levels = sb.render_levels = 2
                sb.subdivision_type = "SIMPLE"
                tb = bpy.data.textures.new("pl%d_%d_%d" % (ci, j, sgn), "VORONOI")
                tb.noise_scale = 0.6
                dd = sl.modifiers.new("d", "DISPLACE")
                dd.texture = tb
                dd.strength = 0.15
                # gira em torno da borda da fenda: a borda de dentro sobe
                tilt = math.radians(rng.uniform(tmin, tmax)) * sgn
                sl.rotation_euler = (tilt, rng.uniform(-0.08, 0.08), math.atan2(dy_, dx_))
                sl.location.z = ground_z(cx_, cy_) + abs(math.sin(tilt)) * wdt * 0.45 - 0.15
                sl.data.materials.append(slab_m)
                if spec.get("rise"):
                    q0, q1, _ = spec["rise"]
                    r_end = sl.rotation_euler.copy()
                    z_end = sl.location.z
                    sl.rotation_euler.x = 0
                    sl.location.z = ground_z(cx_, cy_) - 0.15
                    sl.keyframe_insert("rotation_euler", frame=q0)
                    sl.keyframe_insert("location", frame=q0)
                    sl.rotation_euler = r_end
                    sl.location.z = z_end
                    sl.keyframe_insert("rotation_euler", frame=q1)
                    sl.keyframe_insert("location", frame=q1)

# ---------------------------------------------------------------- a placa de gelo que racha de verdade
# A região vira uma placa contínua partida em células irregulares (Voronoi). Embaixo, uma camada de luz.
# Longe das falhas sobram frestas finas com luz; perto delas as células se afastam, inclinam e sobem.
# "ice_sheet": {"region": [x0, x1, y0, y1], "cells": n, "faults": [[x1, y1, x2, y2], ...], "reach": m,
#               "lift": graus, "push": m, "thick": m, "open": [q0, q1]}  (open = quadros em que a falha abre)
def voronoi_cells(seeds, box):
    x0, x1, y0, y1 = box
    out_ = []
    for i, (sx, sy) in enumerate(seeds):
        poly = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
        for j, (tx, ty) in enumerate(seeds):
            if i == j or (tx - sx) ** 2 + (ty - sy) ** 2 > 400:
                continue
            mx_, my_ = (sx + tx) / 2, (sy + ty) / 2
            nx_, ny_ = tx - sx, ty - sy
            new_ = []
            for k in range(len(poly)):
                a_, b_ = poly[k], poly[(k + 1) % len(poly)]
                da = (a_[0] - mx_) * nx_ + (a_[1] - my_) * ny_
                db = (b_[0] - mx_) * nx_ + (b_[1] - my_) * ny_
                if da <= 0:
                    new_.append(a_)
                if (da < 0) != (db < 0):
                    t_ = da / (da - db)
                    new_.append((a_[0] + (b_[0] - a_[0]) * t_, a_[1] + (b_[1] - a_[1]) * t_))
            poly = new_
            if len(poly) < 3:
                break
        if len(poly) >= 3:
            out_.append(((sx, sy), poly))
    return out_


def seg_dist(px, py, x1, y1, x2, y2):
    dx_, dy_ = x2 - x1, y2 - y1
    t_ = max(0, min(1, ((px - x1) * dx_ + (py - y1) * dy_) / (dx_ * dx_ + dy_ * dy_ or 1)))
    cx_, cy_ = x1 + dx_ * t_, y1 + dy_ * t_
    return math.hypot(px - cx_, py - cy_), (px - cx_, py - cy_), (dx_, dy_)


if spec.get("ice_sheet"):
    isp = spec["ice_sheet"]
    rng = random.Random(isp.get("seed", 5))
    x0, x1, y0, y1 = isp["region"]
    faults = isp.get("faults", [])
    seeds = []
    # células menores perto das falhas (é onde o gelo estilhaça), maiores longe
    while len(seeds) < isp.get("cells", 160):
        x, y = rng.uniform(x0, x1), rng.uniform(y0, y1)
        dmin = min([seg_dist(x, y, *f)[0] for f in faults] or [99])
        cd_ = math.hypot(x - spec["cam"][0], y - spec["cam"][1])
        if rng.random() < (0.35 + 0.65 * math.exp(-dmin / 4.0)) * min(1.0, 18.0 / max(cd_, 1.0)):
            seeds.append((x, y))
    thick = isp.get("thick", 0.7)
    reach = isp.get("reach", 5.0)
    q0, q1 = isp.get("open", [1, 1])
    # luz por baixo: só aparece nas frestas
    glow_m = emit_mat("luz_fenda", tuple(spec.get("crack_color", (1.0, 0.7, 0.35))), spec.get("crack_glow", 6.0))
    bpy.ops.mesh.primitive_plane_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, 0.0))
    gp = bpy.context.object
    gp.location.z = 0.16
    gp.scale = (x1 - x0, y1 - y0, 1)
    gp.data.materials.append(glow_m)
    gp.visible_shadow = False
    # gelo: topo com a neve do jogo; lateral de gelo azul que acende perto da luz (fundo da fresta)
    sheet_m = ice_mat("placa_gelo")
    if spec.get("ground_tex"):
        textured(sheet_m, dict(spec["ground_tex"], bump=0.25))
    n_ = sheet_m.node_tree.nodes
    # a textura segue a posição da peça no mundo (senão cada peça repetia o mesmo pedaço e ficava quadriculado)
    for tc_ in [x for x in n_ if x.type == "TEX_COORD"]:
        for lk in list(tc_.outputs["Object"].links):
            at_ = n_.new("ShaderNodeAttribute")
            at_.attribute_type = "OBJECT"
            at_.attribute_name = "off"
            ad_ = n_.new("ShaderNodeVectorMath")
            ad_.operation = "ADD"
            sheet_m.node_tree.links.new(tc_.outputs["Object"], ad_.inputs[0])
            sheet_m.node_tree.links.new(at_.outputs["Vector"], ad_.inputs[1])
            sheet_m.node_tree.links.new(ad_.outputs[0], lk.to_socket)
    bs = n_["Principled BSDF"]
    top_col = bs.inputs["Base Color"].links[0].from_socket if bs.inputs["Base Color"].links else None
    gm_ = n_.new("ShaderNodeNewGeometry")
    sz = n_.new("ShaderNodeSeparateXYZ")
    sheet_m.node_tree.links.new(gm_.outputs["Normal"], sz.inputs[0])
    rp = n_.new("ShaderNodeMapRange")
    rp.inputs["From Min"].default_value = 0.55
    rp.inputs["From Max"].default_value = 0.8
    sheet_m.node_tree.links.new(sz.outputs[2], rp.inputs["Value"])
    # lateral: gelo azul com manchas suaves (as bandas de onda viravam zebra)
    wv = n_.new("ShaderNodeTexNoise")
    wv.inputs["Scale"].default_value = 2.5
    wv.inputs["Detail"].default_value = 6
    wv.inputs["Roughness"].default_value = 0.6
    sr = n_.new("ShaderNodeValToRGB")
    sr.color_ramp.elements[0].position = 0.35
    sr.color_ramp.elements[0].color = (0.22, 0.42, 0.56, 1)
    sr.color_ramp.elements[1].position = 0.7
    sr.color_ramp.elements[1].color = (0.5, 0.7, 0.82, 1)
    sheet_m.node_tree.links.new(wv.outputs[0], sr.inputs[0])
    mm = n_.new("ShaderNodeMix")
    mm.data_type = "RGBA"
    sheet_m.node_tree.links.new(rp.outputs[0], mm.inputs[0])
    sheet_m.node_tree.links.new(sr.outputs[0], mm.inputs[6])
    if top_col:
        sheet_m.node_tree.links.new(top_col, mm.inputs[7])
    else:
        mm.inputs[7].default_value = (0.85, 0.9, 0.97, 1)
    sheet_m.node_tree.links.new(mm.outputs[2], bs.inputs["Base Color"])
    # brasa nas laterais, mais forte embaixo (a luz da fenda subindo pelo gelo)
    tco = n_.new("ShaderNodeTexCoord")
    sgz = n_.new("ShaderNodeSeparateXYZ")
    sheet_m.node_tree.links.new(tco.outputs["Object"], sgz.inputs[0])
    hz = n_.new("ShaderNodeMapRange")
    hz.inputs["From Min"].default_value = -thick
    hz.inputs["From Max"].default_value = 0.0
    hz.inputs["To Min"].default_value = 1.0
    hz.inputs["To Max"].default_value = 0.0
    sheet_m.node_tree.links.new(sgz.outputs[2], hz.inputs["Value"])
    sd_ = n_.new("ShaderNodeMath")
    sd_.operation = "SUBTRACT"
    sd_.inputs[0].default_value = 1.0
    sheet_m.node_tree.links.new(rp.outputs[0], sd_.inputs[1])
    em1 = n_.new("ShaderNodeMath")
    em1.operation = "MULTIPLY"
    sheet_m.node_tree.links.new(hz.outputs[0], em1.inputs[0])
    sheet_m.node_tree.links.new(sd_.outputs[0], em1.inputs[1])
    em2 = n_.new("ShaderNodeMath")
    em2.operation = "POWER"
    em2.inputs[1].default_value = 2.5
    sheet_m.node_tree.links.new(em1.outputs[0], em2.inputs[0])
    em3 = n_.new("ShaderNodeMath")
    em3.operation = "MULTIPLY"
    em3.inputs[1].default_value = spec.get("crack_glow", 6.0) * 0.5
    sheet_m.node_tree.links.new(em2.outputs[0], em3.inputs[0])
    bs.inputs["Emission Color"].default_value = (*spec.get("crack_color", (1.0, 0.7, 0.35)), 1)
    sheet_m.node_tree.links.new(em3.outputs[0], bs.inputs["Emission Strength"])
    if "Transmission Weight" in bs.inputs:
        bs.inputs["Transmission Weight"].default_value = 0.0
    n_cells = 0
    for (sx, sy), poly in voronoi_cells(seeds, (x0, x1, y0, y1)):
        # borda irregular: cada aresta vira 3 pedaços com tremor; encolhe um pouco (a fresta fina de base)
        cx_ = sum(q[0] for q in poly) / len(poly)
        cy_ = sum(q[1] for q in poly) / len(poly)
        ring = []
        for k in range(len(poly)):
            a_, b_ = poly[k], poly[(k + 1) % len(poly)]
            for t_ in (0.0, 0.33, 0.66):
                px_ = a_[0] + (b_[0] - a_[0]) * t_
                py_ = a_[1] + (b_[1] - a_[1]) * t_
                if t_ > 0:
                    px_ += rng.uniform(-0.08, 0.08)
                    py_ += rng.uniform(-0.08, 0.08)
                ring.append((px_, py_))
        shrink = isp.get("gap", 0.05)
        ring2 = []
        for px_, py_ in ring:
            dx_, dy_ = px_ - cx_, py_ - cy_
            L_ = math.hypot(dx_, dy_) or 1
            f_ = max(0.0, (L_ - shrink) / L_)
            ring2.append((cx_ + dx_ * f_, cy_ + dy_ * f_))
        nv = len(ring2)
        top_z = rng.uniform(0.18, 0.3)
        vs = [(px_ - cx_, py_ - cy_, top_z + rng.uniform(-0.03, 0.03)) for px_, py_ in ring2] +              [((px_ - cx_) * 0.96, (py_ - cy_) * 0.96, top_z - thick) for px_, py_ in ring2]
        fs = [tuple(range(nv)), tuple(range(2 * nv - 1, nv - 1, -1))] + [(k, (k + 1) % nv, nv + (k + 1) % nv, nv + k) for k in range(nv)]
        me = bpy.data.meshes.new("gelo_cel")
        me.from_pydata(vs, [], fs)
        me.validate()
        ob = bpy.data.objects.new("gelo_cel", me)
        sc.collection.objects.link(ob)
        ob.location = (cx_, cy_, 0.0)
        ob["off"] = (cx_, cy_, 0.0)
        ob.data.materials.append(sheet_m)
        bv = ob.modifiers.new("bv", "BEVEL")
        bv.width = 0.03
        bv.segments = 2
        n_cells += 1
        # perto da falha: afasta, inclina (a borda do lado da falha sobe) e levanta
        best = None
        for f in faults:
            d_, (ox, oy), (fx, fy) = seg_dist(cx_, cy_, *f)
            if best is None or d_ < best[0]:
                best = (d_, ox, oy, fx, fy)
        if best and best[0] < reach:
            d_, ox, oy, fx, fy = best
            k_ = (1 - d_ / reach) ** 1.5 * rng.uniform(0.6, 1.2)
            Lo = math.hypot(ox, oy) or 1
            ux, uy = ox / Lo, oy / Lo
            push = isp.get("push", 0.8) * k_
            ang = math.radians(isp.get("lift", 30)) * k_
            axis = V((fx, fy, 0)).normalized()
            # o lado da célula voltado para a falha sobe: gira em torno do eixo paralelo à falha
            if axis.cross(V((ux, uy, 0))).z > 0:
                ang = -ang
            rest_loc = ob.location.copy()
            ob.rotation_mode = "AXIS_ANGLE"
            ob.rotation_axis_angle = (0, axis.x, axis.y, 0)
            ob.keyframe_insert("rotation_axis_angle", frame=q0)
            ob.keyframe_insert("location", frame=q0)
            ob.rotation_axis_angle = (ang, axis.x, axis.y, 0)
            ob.location = rest_loc + V((ux * push, uy * push, abs(math.sin(ang)) * 0.6 + push * 0.25))
            # cada pedaço cede num instante um pouco diferente (o mais perto da falha primeiro)
            qq = q0 + (q1 - q0) * (0.35 + 0.65 * (d_ / reach)) * rng.uniform(0.8, 1.1)
            ob.keyframe_insert("rotation_axis_angle", frame=int(max(q0 + 2, qq)))
            ob.keyframe_insert("location", frame=int(max(q0 + 2, qq)))
    print("GELO", n_cells, "celulas")

# ---------------------------------------------------------------- personagens
def posebone_rot(arm, name, axis, deg):
    pb = arm.pose.bones.get(name)
    if pb is None:
        return
    bpy.context.view_layer.update()
    head = arm.matrix_world @ pb.head
    R = mathutils.Matrix.Translation(head) @ mathutils.Matrix.Rotation(math.radians(deg), 4, AX[axis]) @ mathutils.Matrix.Translation(-head)
    pb.matrix = arm.matrix_world.inverted() @ R @ arm.matrix_world @ pb.matrix
    bpy.context.view_layer.update()


def fcurves_of(A):
    try:
        return list(A.fcurves)
    except Exception:
        pass
    out_ = []
    for ly in A.layers:
        for st_ in ly.strips:
            for cb in st_.channelbags:
                out_ += list(cb.fcurves)
    return out_


def anchored(arm, A, f0, root="pelvis", lock=False):
    # cópia da ação com o deslocamento horizontal do osso-raiz zerado no quadro inicial do trecho:
    # cada trecho começa no mesmo lugar (sem pulo entre animações), mas o andar/abaixar dentro dele continua
    B = A.copy()
    B.name = A.name + "_anc%d" % f0
    # o pano ($cloth) vem com a simulação do jogo gravada em outro espaço: sem as curvas, ele segue o corpo na pose de modelagem
    for ly in B.layers:
        for st_ in ly.strips:
            for cb in st_.channelbags:
                for fc in [f for f in cb.fcurves if '"$cloth' in f.data_path]:
                    cb.fcurves.remove(fc)
    pb = arm.pose.bones.get(root)
    if pb is None:
        return B
    # qual eixo da posição do quadril é o vertical: testa empurrando cada um e vendo quem sobe
    keep = arm.animation_data.action
    arm.animation_data.action = B
    if B.slots:
        arm.animation_data.action_slot = B.slots[0]
    sc.frame_set(int(f0))
    bpy.context.view_layer.update()
    z0 = (arm.matrix_world @ pb.head).z
    dz = []
    for i in range(3):
        old_ = pb.location[i]
        pb.location[i] = old_ + 0.1
        bpy.context.view_layer.update()
        dz.append(abs((arm.matrix_world @ pb.head).z - z0))
        pb.location[i] = old_
    bpy.context.view_layer.update()
    up = max(range(3), key=lambda i: dz[i])
    arm.animation_data.action = keep
    for fc in fcurves_of(B):
        if fc.data_path == 'pose.bones["%s"].location' % root and fc.array_index != up:
            v0 = fc.evaluate(f0)
            for kp in fc.keyframe_points:
                if lock:
                    kp.co.y = kp.handle_left.y = kp.handle_right.y = 0.0
                else:
                    kp.co.y -= v0
                    kp.handle_left.y -= v0
                    kp.handle_right.y -= v0
    return B


def nocloth(A):
    B = A.copy()
    B.name = A.name + "_nc"
    for ly in B.layers:
        for st_ in ly.strips:
            for cb in st_.channelbags:
                for fc in [f for f in cb.fcurves if '"$cloth' in f.data_path]:
                    cb.fcurves.remove(fc)
    return B


def root_of(arm):
    return "pelvis" if "pelvis" in arm.data.bones else next(b.name for b in arm.data.bones if b.parent is None)


def root_at(arm, A, f, root=None):
    root = root or root_of(arm)
    keep = arm.animation_data.action
    arm.animation_data.action = A
    if A.slots:
        arm.animation_data.action_slot = A.slots[0]
    sc.frame_set(int(round(f)))
    bpy.context.view_layer.update()
    p_ = arm.pose.bones[root].head.copy()
    arm.animation_data.action = keep
    return p_


def shift_root(arm, A, d_arm, root=None):
    root = root or root_of(arm)
    # desloca o quadril da ação inteira por d (no espaço da armature); o osso-raiz não tem pai, então loc = R_rest⁻¹·d
    b = arm.data.bones[root]
    dl = b.matrix_local.to_3x3().inverted() @ d_arm
    for fc in fcurves_of(A):
        if fc.data_path == 'pose.bones["%s"].location' % root:
            for kp in fc.keyframe_points:
                kp.co.y += dl[fc.array_index]
                kp.handle_left.y += dl[fc.array_index]
                kp.handle_right.y += dl[fc.array_index]


def turn_root(arm, A, deg, root=None):
    # gira a ação inteira em volta do eixo vertical (cada cena do jogo foi gravada olhando para um lado diferente)
    root = root or root_of(arm)
    b = arm.data.bones[root]
    r3 = b.matrix_local.to_3x3()
    W = mathutils.Matrix.Rotation(math.radians(deg), 3, "Z")
    M = r3.inverted() @ W @ r3
    qM = M.to_quaternion()
    for dp, n in (("rotation_quaternion", 4), ("location", 3)):
        fcs = {fc.array_index: fc for fc in fcurves_of(A) if fc.data_path == 'pose.bones["%s"].%s' % (root, dp)}
        if len(fcs) < n:
            continue
        frames = sorted({round(kp.co.x, 3) for fc in fcs.values() for kp in fc.keyframe_points})
        vals = []
        for f in frames:
            v = [fcs[i].evaluate(f) for i in range(n)]
            if n == 4:
                q = qM @ mathutils.Quaternion(v)
                vals.append((q.w, q.x, q.y, q.z))
            else:
                vals.append(tuple(M @ V(v)))
        for i in range(n):
            fc = fcs[i]
            fc.keyframe_points.clear()
            fc.keyframe_points.add(len(frames))
            for k_, (f, v) in enumerate(zip(frames, vals)):
                kp = fc.keyframe_points[k_]
                kp.co = (f, v[i])
                kp.interpolation = "LINEAR"
            fc.update()


def pose_layer(arm, name, poses):
    # camada por cima (COMBINE) com rotações extras de osso em quadros-chave: abraço, cabeça virando, mão no ombro
    L = bpy.data.actions.new("ajuste_" + name)
    keep = arm.animation_data.action
    arm.animation_data.action = L
    used = sorted({bn for p_ in poses for bn in p_["bones"]})
    aw = arm.matrix_world.to_3x3().inverted()
    for p_ in poses:
        for bn in used:
            pb = arm.pose.bones.get(bn)
            if pb is None:
                continue
            pb.rotation_mode = "QUATERNION"
            q = mathutils.Quaternion()
            for axis, deg in p_["bones"].get(bn, []):
                ax = (pb.bone.matrix_local.to_3x3().inverted() @ (aw @ AX[axis])).normalized()
                q = mathutils.Quaternion(ax, math.radians(deg)) @ q
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=p_["at"])
    for fc in fcurves_of(L):
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.easing = "EASE_IN_OUT"
    arm.animation_data.action = keep
    tr = arm.animation_data.nla_tracks.new()
    st = tr.strips.new(L.name, 1, L)
    if hasattr(st, "action_slot") and L.slots:
        st.action_slot = L.slots[0]
    st.blend_type = "COMBINE"
    st.extrapolation = "HOLD"
    st.frame_end = max(st.frame_end, N_FR + 1)


VOG = {"a": (0.62, 0.0), "e": (0.42, 0.0), "i": (0.26, 0.0), "o": (0.45, 0.45), "u": (0.22, 0.7)}


def silabas(txt):
    # quebra grosseira em sílabas pelos grupos de vogais; devolve a vogal principal de cada uma
    import unicodedata
    t = "".join(c for c in unicodedata.normalize("NFD", txt.lower()) if unicodedata.category(c) != "Mn")
    out_, cur = [], ""
    for c in t:
        if c in "aeiou":
            cur += c
        else:
            if cur:
                out_.append(max(cur, key=lambda v: VOG[v][0]))
            cur = ""
            if c in ".,;:!?…":
                out_.append(",")
    if cur:
        out_.append(max(cur, key=lambda v: VOG[v][0]))
    return out_


def face_anim(objs, face, seed=1):
    import random
    rnd = random.Random(seed)
    keys = {}  # forma -> {quadro: valor}

    def put(name, fr_, v):
        keys.setdefault(name, {})[int(round(fr_))] = v

    for ln in face.get("lines", []):
        f = ln["at"]
        rate = ln.get("rate", 5.5)
        put("jawDrop", f - 2, 0.0)
        for sy in silabas(ln["text"]):
            if sy == ",":
                put("jawDrop", f + 2, 0.02)
                f += rate * 2.2
                continue
            jaw, pk = VOG[sy]
            put("jawDrop", f + rate * 0.45, jaw * ln.get("gain", 1.0) * rnd.uniform(0.8, 1.15))
            for side in ("left_", "right_"):
                put(side + "lipPuckerer", f + rate * 0.45, pk * 0.8)
                put(side + "lipStretcher", f + rate * 0.45, 0.25 if sy in "ei" else 0.0)
            put("jawDrop", f + rate * 0.95, 0.05)
            f += rate * rnd.uniform(0.85, 1.2)
        put("jawDrop", f + 3, 0.0)
        for side in ("left_", "right_"):
            put(side + "lipPuckerer", f + 3, 0.0)
            put(side + "lipStretcher", f + 3, 0.0)
    # piscadas a cada 2,5–4,5 s (fora dos trechos de olho fechado)
    if face.get("blink", True):
        f = rnd.uniform(20, 60)
        shut = face.get("closed", [])
        while f < N_FR:
            if not any(a_ - 8 <= f <= b_ + 8 for a_, b_ in shut):
                for side in ("left_", "right_"):
                    put(side + "eyeClosed", f, 0.0)
                    put(side + "eyeClosed", f + 2, 1.0)
                    put(side + "eyeClosed", f + 5, 0.0)
            f += rnd.uniform(75, 135)
        for a_, b_ in shut:
            for side in ("left_", "right_"):
                put(side + "eyeClosed", a_ - 6, 0.0)
                put(side + "eyeClosed", a_, 0.9)
                put(side + "eyeClosed", b_, 0.9)
                put(side + "eyeClosed", b_ + 6, 0.0)
    # expressões: {"at": q, "shapes": {"innerBrowRaiser": 0.6, ...}} (sem lado = os dois lados)
    exps = face.get("expr", [])
    names = sorted({n for e in exps for n in e["shapes"]})
    for e in exps:
        for n in names:
            v = e["shapes"].get(n, 0.0)
            # nomes do Source (AU1R, AD30L...) já vêm com o lado: usa direto
            for nm in ([n] if n.startswith(("jaw", "left_", "right_", "AU", "AD")) else ["left_" + n, "right_" + n]):
                put(nm, e["at"], v)
    for o in objs:
        kb = o.data.shape_keys.key_blocks
        for name, fk in keys.items():
            k = kb.get(name)
            if k is None:
                continue
            for fr_, v in sorted(fk.items()):
                k.value = v
                k.keyframe_insert("value", frame=fr_)
        ad = o.data.shape_keys.animation_data
        if ad and ad.action:
            for fc in fcurves_of(ad.action):
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"


CH_OBJ = {}
IK_T = []
N_FR = spec.get("frames", 1)
sc.frame_start, sc.frame_end = 1, N_FR
sc.render.fps = spec.get("fps", 30)
for ch in spec["chars"]:
    before = set(bpy.data.objects)
    acts_before = set(bpy.data.actions)
    if ch.get("mdl"):
        # modelo do Half-Life 2 / Episódios (Source 1), pelo SourceIO, com as animações do próprio jogo
        import addon_utils, os
        addon_utils.enable("SourceIO")
        bpy.ops.sourceio.mdl(filepath=ch["mdl"], directory=os.path.dirname(ch["mdl"]) + "/", files=[{"name": os.path.basename(ch["mdl"])}],
                             import_animations=True, import_include_animations=True, import_textures=True, scale=0.0254)
    else:
        bpy.ops.import_scene.gltf(filepath=ch["glb"])
    ACTS = {x.name.lstrip("@").rsplit(".", 1)[0] if x.name.rsplit(".", 1)[-1].isdigit() else x.name.lstrip("@"): x for x in bpy.data.actions if x not in acts_before}
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        if o.type == "MESH" and (o.name.startswith("Icosphere") or "physics" in o.name.lower()):
            o.hide_render = True
        # borrão das asas da formiga-leão: no jogo só aparece voando
        if o.type == "MESH" and not ch.get("fly") and o.material_slots and all(m_.material and m_.material.name.lower().startswith("wingblur") for m_ in o.material_slots):
            o.hide_render = True
        # lente dos óculos (Kleiner): no jogo é um reflexo por cima; aqui saía preta como óculos escuros
        if o.type == "MESH":
            for ms in o.material_slots:
                mt = ms.material
                # armação dos óculos: a textura tem a lente no alfa
                if mt and mt.use_nodes and mt.name.lower().startswith(("glassesfront", "glassesside")):
                    bs = next((n for n in mt.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
                    tx_ = next((n for n in mt.node_tree.nodes if n.type == "TEX_IMAGE"), None)
                    if bs and tx_:
                        mt.node_tree.links.new(tx_.outputs["Alpha"], bs.inputs["Alpha"])
                        mt.surface_render_method = "BLENDED"
                if mt and any(w in mt.name.lower() for w in ("glasslens", "glass2")):
                    # a lente: vidro quase invisível, só um brilho
                    mt.use_nodes = True
                    nn = mt.node_tree.nodes
                    nn.clear()
                    ou_ = nn.new("ShaderNodeOutputMaterial")
                    tr_ = nn.new("ShaderNodeBsdfTransparent")
                    gl_ = nn.new("ShaderNodeBsdfGlossy")
                    gl_.inputs["Roughness"].default_value = 0.05
                    mx_ = nn.new("ShaderNodeMixShader")
                    mx_.inputs[0].default_value = 0.06
                    mt.node_tree.links.new(tr_.outputs[0], mx_.inputs[1])
                    mt.node_tree.links.new(gl_.outputs[0], mx_.inputs[2])
                    mt.node_tree.links.new(mx_.outputs[0], ou_.inputs[0])
                    mt.surface_render_method = "BLENDED"
    # os guias dos olhos (Source) já seguem o osso da cabeça por restrição; pendurar no pivô deslocava duas vezes e a íris saía do lugar
    roots = [o for o in new if o.parent is None and not any(c.type == "CHILD_OF" for c in o.constraints)]
    arm = next((o for o in new if o.type == "ARMATURE"), None)
    piv = bpy.data.objects.new("piv_" + ch.get("name", "c"), None)
    sc.collection.objects.link(piv)
    for r in roots:
        r.parent = piv
    if arm:
        act = ch.get("action")
        if arm.animation_data is None:
            arm.animation_data_create()
        # pano ($cloth): sem a simulação do jogo, cada osso de pano passa a seguir o osso do corpo mais próximo
        if ch.get("cloth_follow", True) and any(b.name.startswith("$cloth") for b in arm.data.bones):
            body = [b for b in ("pelvis", "spine_0", "spine_1", "spine_2", "spine_3", "neck_0", "head", "clavicle_L", "clavicle_R",
                                "arm_upper_L", "arm_upper_R", "leg_upper_L", "leg_upper_R", "leg_lower_L", "leg_lower_R") if b in arm.data.bones]
            bpy.context.view_layer.objects.active = arm
            arm.select_set(True)
            bpy.ops.object.mode_set(mode="EDIT")
            eb = arm.data.edit_bones
            for b in eb:
                if b.name.startswith("$cloth"):
                    b.use_connect = False
                    b.parent = eb[min(body, key=lambda n: (eb[n].head - b.head).length if not n.startswith("leg") else (((eb[n].head + eb[n].tail) / 2) - b.head).length)]
            bpy.ops.object.mode_set(mode="OBJECT")
        # o importador deixa uma faixa de NLA para cada animação do jogo, e elas tocam por baixo: some com todas
        for t_ in list(arm.animation_data.nla_tracks):
            arm.animation_data.nla_tracks.remove(t_)
        if act and act in bpy.data.actions:
            arm.animation_data.action = bpy.data.actions[act]
            if hasattr(arm.animation_data, "action_slot") and bpy.data.actions[act].slots:
                arm.animation_data.action_slot = bpy.data.actions[act].slots[0]
        elif not act:
            arm.animation_data.action = None
        if ch.get("clips"):
            # vários trechos de animação em sequência, cada um numa faixa por cima, com mistura na entrada
            arm.animation_data.action = None
            prev = None
            for i, c in enumerate(ch["clips"]):
                A0 = ACTS.get(c["action"]) or bpy.data.actions[c["action"]]
                f0 = c.get("from", 0)
                A = anchored(arm, A0, f0, root=root_of(arm), lock=c.get("anchor") == "lock") if c.get("anchor", False) else nocloth(A0)
                if c.get("turn"):
                    turn_root(arm, A, c["turn"])
                if prev is not None and c.get("cont", True):
                    # continuidade: o quadril começa este trecho onde terminou o anterior (sem teletransporte)
                    pa = root_at(arm, prev[0], prev[1])
                    pb_ = root_at(arm, A, f0)
                    shift_root(arm, A, V((pa.x - pb_.x, pa.y - pb_.y, 0)))
                prev = (A, c.get("to", A0.frame_range[1]))
                tr = arm.animation_data.nla_tracks.new()
                st = tr.strips.new("%s_%d" % (c["action"], i), int(c.get("at", 1)), A)
                if hasattr(st, "action_slot") and A.slots:
                    st.action_slot = A.slots[0]
                f1 = c.get("to", A0.frame_range[1])
                st.action_frame_start, st.action_frame_end = f0, max(f1, f0 + 1)
                st.scale = 1.0 / c.get("speed", 1.0)
                if c.get("loop"):
                    st.repeat = max(1.0, math.ceil((N_FR - c.get("at", 1)) / max(1.0, (f1 - f0) * st.scale)) + 1)
                st.extrapolation = "HOLD" if i == 0 else "HOLD_FORWARD"
                if i > 0:
                    st.blend_in = c.get("blend", 12)
            if ch.get("poses"):
                pose_layer(arm, ch.get("name", "c"), ch["poses"])
            sc.frame_set(1)
            if ch.get("face"):
                face_anim([o for o in new if o.type == "MESH" and o.data.shape_keys], ch["face"], seed=len(ch.get("name", "c")))
        elif ch.get("anim") and act in bpy.data.actions:
            # animado: a ação toca numa faixa do NLA, com o quadro 1 da cena = quadro "frame" da ação, em loop
            A = bpy.data.actions[act]
            arm.animation_data.action = None
            f0, f1 = ch.get("frame", 0), A.frame_range[1]
            tr = arm.animation_data.nla_tracks.new()
            st = tr.strips.new(A.name, 1, A)
            if hasattr(st, "action_slot") and A.slots:
                st.action_slot = A.slots[0]
            st.action_frame_start, st.action_frame_end = f0, max(f1, f0 + 1)
            st.scale = 1.0 / ch.get("speed", 1.0)
            st.repeat = max(1.0, math.ceil(N_FR / max(1.0, (f1 - f0) * st.scale)) + 1)
            sc.frame_set(1)
        else:
            sc.frame_set(ch.get("frame", 1))
            bpy.context.view_layer.update()
            for bn, (axis, deg) in ch.get("pose", {}).items():
                posebone_rot(arm, bn, axis, deg)
            # trava a pose numa ação de um quadro só (no quadro 1 da cena), para o próximo personagem não desfazer esta
            frozen = bpy.data.actions.new("pose_" + ch.get("name", "c"))
            arm.animation_data.action = frozen
            for pb in arm.pose.bones:
                pb.rotation_mode = "QUATERNION"
                m_ = pb.matrix_basis.copy()
                pb.location, pb.rotation_quaternion, pb.scale = m_.to_translation(), m_.to_quaternion(), m_.to_scale()
                for dp in ("location", "rotation_quaternion", "scale"):
                    pb.keyframe_insert(dp, frame=1)
    # a pose é feita com o personagem na origem olhando para -Y (eixo x = lado, -y = frente); só depois ele vai para o lugar
    dg = bpy.context.evaluated_depsgraph_get()
    hit = g.evaluated_get(dg).ray_cast(g.matrix_world.inverted() @ V((ch["pos"][0], ch["pos"][1], 50)), V((0, 0, -1)))
    gz = (g.matrix_world @ hit[1]).z if hit[0] else 0
    # em cima da placa de gelo, pisa no gelo (não no chão enterrado embaixo); mede com as placas já abertas
    _fr0 = sc.frame_current
    if spec.get("ice_sheet"):
        sc.frame_set((spec.get("stills") or [spec["ice_sheet"].get("open", [1, 1])[1] + 3])[0])
        dg = bpy.context.evaluated_depsgraph_get()
    for ic_ in [o for o in sc.collection.objects if o.name.startswith("gelo_cel")]:
        mi_ = ic_.matrix_world.inverted()
        h2 = ic_.evaluated_get(dg).ray_cast(mi_ @ V((ch["pos"][0], ch["pos"][1], 50)), (mi_.to_3x3() @ V((0, 0, -1))).normalized())
        if h2[0]:
            gz = max(gz, (ic_.matrix_world @ h2[1]).z)
    sc.frame_set(_fr0)
    piv.location = (ch["pos"][0], ch["pos"][1], gz + ch.get("z", 0))
    piv.rotation_euler[2] = math.radians(ch.get("rot", 0))
    piv.scale = (ch.get("scale", 1),) * 3
    bpy.context.view_layer.update()
    bpy.context.view_layer.update()
    _ms = [o for o in new if o.type == "MESH" and not o.hide_render]

    def _bbox():
        dg_ = bpy.context.evaluated_depsgraph_get()
        ps = []
        for o in _ms:
            ev = o.evaluated_get(dg_)
            mm = ev.to_mesh()
            ps += [(o.matrix_world @ mm.vertices[i].co) for i in range(0, len(mm.vertices), max(1, len(mm.vertices) // 300))]
            ev.to_mesh_clear()
        return ps

    # recentra: algumas animações levam o corpo para longe pelo osso-raiz; o personagem fica no ponto pedido, de pé no chão
    if ch.get("snap", True):
        ps = _bbox()
        if ps:
            cxy = V(((min(p.x for p in ps) + max(p.x for p in ps)) / 2, (min(p.y for p in ps) + max(p.y for p in ps)) / 2, 0))
            mz = min(p.z for p in ps)
            off = V((ch["pos"][0] - cxy.x + ch.get("dx", 0), ch["pos"][1] - cxy.y + ch.get("dy", 0), gz - mz + ch.get("z", 0)))
            piv.location = piv.location + off
            bpy.context.view_layer.update()
    # deslocamentos no tempo: [quadro, x, y, giro] — anda até alguém, vira para alguém
    if ch.get("moves"):
        base = piv.location.copy()
        for mv in ch["moves"]:
            fr_, x_, y_ = mv[0], mv[1], mv[2]
            nx_, ny_ = base.x + x_ - ch["pos"][0], base.y + y_ - ch["pos"][1]
            dz_ = 0.0
            if ch.get("follow_ground", True):
                # os pés acompanham a neve ondulada: mesma folga sobre o chão do ponto inicial
                dg__ = bpy.context.evaluated_depsgraph_get()
                h1 = g.evaluated_get(dg__).ray_cast(g.matrix_world.inverted() @ V((nx_, ny_, 50)), V((0, 0, -1)))
                h0 = g.evaluated_get(dg__).ray_cast(g.matrix_world.inverted() @ V((base.x, base.y, 50)), V((0, 0, -1)))
                if h1[0] and h0[0]:
                    dz_ = (g.matrix_world @ h1[1]).z - (g.matrix_world @ h0[1]).z
            ices_ = [o for o in sc.collection.objects if o.name.startswith("gelo_cel")]
            if ices_:
                sc.frame_set(fr_)
                dg__ = bpy.context.evaluated_depsgraph_get()
                hz_ = None
                for ic_ in ices_:
                    mi_ = ic_.matrix_world.inverted()
                    h2 = ic_.evaluated_get(dg__).ray_cast(mi_ @ V((nx_, ny_, 50)), (mi_.to_3x3() @ V((0, 0, -1))).normalized())
                    if h2[0]:
                        z2 = (ic_.matrix_world @ h2[1]).z
                        hz_ = z2 if hz_ is None else max(hz_, z2)
                if hz_ is not None:
                    dz_ = hz_ - (base.z - ch.get("z", 0))
                sc.frame_set(1)
            piv.location = (nx_, ny_, base.z + dz_)
            piv.keyframe_insert("location", frame=fr_)
            if len(mv) > 3:
                piv.rotation_euler[2] = math.radians(mv[3])
                piv.keyframe_insert("rotation_euler", index=2, frame=fr_)
        piv.location = base
        if ch.get("moves_linear") and piv.animation_data and piv.animation_data.action:
            for fc in fcurves_of(piv.animation_data.action):
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"
        sc.frame_set(1)
    _dg = bpy.context.evaluated_depsgraph_get()
    _zs = []
    for o in _ms:
        ev = o.evaluated_get(_dg)
        mm = ev.to_mesh()
        _zs += [(o.matrix_world @ mm.vertices[i].co) for i in range(0, len(mm.vertices), max(1, len(mm.vertices) // 300))]
        ev.to_mesh_clear()
    if ch.get("clip_y") is not None:
        # atravessando o portal: o que passou do plano do portal (y maior) some, o que ainda está deste lado aparece
        done_ = set()
        for o in _ms:
            for ms_ in o.material_slots:
                m_ = ms_.material
                if not m_ or not m_.use_nodes or m_.name in done_:
                    continue
                done_.add(m_.name)
                nt_ = m_.node_tree
                mo_ = next((n for n in nt_.nodes if n.type == "OUTPUT_MATERIAL"), None)
                if not mo_ or not mo_.inputs["Surface"].links:
                    continue
                src_ = mo_.inputs["Surface"].links[0].from_socket
                gp_ = nt_.nodes.new("ShaderNodeNewGeometry")
                sp_ = nt_.nodes.new("ShaderNodeSeparateXYZ")
                nt_.links.new(gp_.outputs["Position"], sp_.inputs[0])
                gt_ = nt_.nodes.new("ShaderNodeMath")
                gt_.operation = "GREATER_THAN"
                gt_.inputs[1].default_value = ch["clip_y"]
                nt_.links.new(sp_.outputs[1], gt_.inputs[0])
                tr_ = nt_.nodes.new("ShaderNodeBsdfTransparent")
                mx_ = nt_.nodes.new("ShaderNodeMixShader")
                nt_.links.new(gt_.outputs[0], mx_.inputs[0])
                nt_.links.new(src_, mx_.inputs[1])
                nt_.links.new(tr_.outputs[0], mx_.inputs[2])
                nt_.links.new(mx_.outputs[0], mo_.inputs["Surface"])
                if hasattr(m_, "surface_render_method"):
                    m_.surface_render_method = "DITHERED"
    if ch.get("hide_at"):
        # some de vez a partir de um quadro (atravessou o portal)
        for o in _ms:
            o.hide_render = False
            o.keyframe_insert("hide_render", frame=ch["hide_at"] - 1)
            o.hide_render = True
            o.keyframe_insert("hide_render", frame=ch["hide_at"])
            o.hide_render = False
    if ch.get("show_at"):
        # aparece só a partir de um quadro (sai de baixo do gelo)
        for o in _ms:
            o.hide_render = True
            o.keyframe_insert("hide_render", frame=1)
            o.keyframe_insert("hide_render", frame=ch["show_at"] - 1)
            o.hide_render = False
            o.keyframe_insert("hide_render", frame=ch["show_at"])
    CH_OBJ[ch.get("name", "c")] = (arm, piv, ch)
    print("CHAR", ch.get("name"), arm.name if arm else None, "piv", [round(v, 2) for v in piv.location], "min", [round(min(p[i] for p in _zs), 2) for i in range(3)] if _zs else None, "max", [round(max(p[i] for p in _zs), 2) for i in range(3)] if _zs else None)



def frame_of(piv, v):
    # vetor no referencial do personagem (x = direita, y = frente, z = cima) para o mundo; ele olha para -Y antes de girar
    r = piv.rotation_euler[2]
    rx, ry = V((-math.cos(r), -math.sin(r), 0)), V((math.sin(r), -math.cos(r), 0))
    return rx * v[0] + ry * v[1] + V((0, 0, v[2]))


for nm_, (arm, piv, ch) in CH_OBJ.items():
    for k in ch.get("ik", []):
        o_arm, o_piv, _ = CH_OBJ[k["on"]]
        sc.frame_set(int(k["full"]))
        bpy.context.view_layer.update()
        ob = o_arm.pose.bones[k["bone"]]
        tgt = bpy.data.objects.new("ik_%s_%s" % (nm_, k["hand"]), None)
        sc.collection.objects.link(tgt)
        tgt.location = (o_arm.matrix_world @ ob.head) + frame_of(o_piv, k["off"])
        bpy.context.view_layer.update()
        mw = tgt.matrix_world.copy()
        tgt.parent, tgt.parent_type, tgt.parent_bone = o_arm, "BONE", k["bone"]
        tgt.matrix_world = mw
        pole = bpy.data.objects.new("pole_%s_%s" % (nm_, k["hand"]), None)
        sc.collection.objects.link(pole)
        pole.location = piv.location + frame_of(piv, k.get("pole", (0.8 if k["hand"].endswith("R") else -0.8, 0.3, 0.9)))
        pole.parent = piv
        pole.matrix_parent_inverse = piv.matrix_world.inverted()
        pb = arm.pose.bones[k["hand"]]
        c = pb.constraints.new("IK")
        c.target = tgt
        c.pole_target = pole
        c.pole_angle = math.radians(k.get("pole_angle", -90))
        c.use_tail = False
        c.chain_count = 2
        c.influence = 0.0
        c.keyframe_insert("influence", frame=k["start"])
        c.influence = k.get("amount", 1.0)
        c.keyframe_insert("influence", frame=k["full"])
        if k.get("release"):
            c.keyframe_insert("influence", frame=k["release"][0])
            c.influence = 0.0
            c.keyframe_insert("influence", frame=k["release"][1])
        # a mão em si deita nas costas: copia a rotação do osso de onde ela pousa, com um giro
        IK_T.append((nm_, k, tgt, o_piv))
        print("IK", nm_, k["hand"], "->", k["on"], k["bone"], [round(x, 2) for x in tgt.matrix_world.translation])
sc.frame_set(1)

# ---------------------------------------------------------------- neve caindo (partículas: flocos pequenos, descendo devagar, com vento leve)
if spec.get("snow", 0) > 0:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1, location=(0, 0, -50))
    bpy.context.object.scale = (1, 1, 0.45)
    floco = bpy.context.object
    floco.name = "floco"
    fmat = mat("floco", (0.95, 0.97, 1.0), 0.9)
    floco.data.materials.append(fmat)
    c0 = V(spec["cam"])
    bpy.ops.mesh.primitive_plane_add(size=1, location=(c0.x, c0.y + 9, 7))
    em = bpy.context.object
    em.scale = (26, 20, 1)
    em.show_instancer_for_render = False
    psm = em.modifiers.new("neve", "PARTICLE_SYSTEM")
    pset = psm.particle_system.settings
    pset.count = spec["snow"]
    pset.frame_start, pset.frame_end = -260, N_FR
    pset.lifetime = 420
    pset.normal_factor = -spec.get("snow_speed", 0.55)
    pset.brownian_factor = 0.25
    pset.effector_weights.gravity = 0.0
    pset.render_type = "OBJECT"
    pset.instance_object = floco
    pset.particle_size = spec.get("snow_size", 0.02)
    pset.size_random = 0.6
    pset.use_rotations = True
    floco.hide_render = False
    if spec.get("wind", 0) > 0:
        bpy.ops.object.effector_add(type="WIND", location=(c0.x - 30, c0.y + 10, 1))
        wd = bpy.context.object
        wd.rotation_euler = (0, math.radians(90), math.radians(spec.get("wind_dir", 0)))
        wd.field.strength = spec["wind"]
        wd.field.noise = 1.5
        wd.field.flow = 0.5
        bpy.ops.mesh.primitive_plane_add(size=1, location=(c0.x - 12, c0.y + 10, 0.25))
        em2 = bpy.context.object
        em2.scale = (6, 24, 1)
        em2.show_instancer_for_render = False
        p2 = em2.modifiers.new("sopro", "PARTICLE_SYSTEM").particle_system.settings
        p2.count = spec.get("drift", 6000)
        p2.frame_start, p2.frame_end = -120, N_FR
        p2.lifetime = 160
        p2.normal_factor = 0.08
        p2.brownian_factor = 0.6
        p2.effector_weights.gravity = 0.05
        p2.render_type = "OBJECT"
        p2.instance_object = floco
        p2.particle_size = 0.008
        p2.size_random = 0.7
# "portal_wall": {"x": centro, "y": face, "w": largura, "h": altura, "rough": relevo longe do portal}
if spec.get("portal_wall"):
    pw = spec["portal_wall"]
    wx_, wy_, ww_, wh_ = pw["x"], pw["y"], pw.get("w", 16), pw.get("h", 8)
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=220, y_subdivisions=120, size=1, location=(wx_, wy_, wh_ / 2 - 0.6))
    wl_ = bpy.context.object
    wl_.name = "paredao"
    wl_.rotation_euler = (math.radians(90), 0, 0)
    wl_.scale = (ww_, wh_, 1)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    # o relevo cresce longe do portal; em volta dele a face é lisa, para o anel assentar na parede
    vg_ = wl_.vertex_groups.new(name="relevo")
    pc_ = spec.get("portal", [wx_, wy_, 1.2, 1.0, 0])
    for v_ in wl_.data.vertices:
        w_ = wl_.matrix_world @ v_.co
        d_ = math.hypot((w_.x - pc_[0]) / 1.0, (w_.z - pc_[2]) / 1.3) - pc_[3]
        vg_.add([v_.index], min(1.0, max(0.0, d_ / 1.6)) ** 1.5, "REPLACE")
    tw_ = bpy.data.textures.new("paredao_rel", "CLOUDS")
    tw_.noise_scale = 1.4
    tw_.noise_depth = 5
    dm_ = wl_.modifiers.new("rel", "DISPLACE")
    dm_.texture = tw_
    dm_.texture_coords = "GLOBAL"
    dm_.direction = "Y"
    dm_.strength = pw.get("rough", 1.4)
    dm_.mid_level = 0.0
    dm_.vertex_group = "relevo"
    so_ = wl_.modifiers.new("esp", "SOLIDIFY")
    so_.thickness = 3.0
    so_.offset = -1.0
    wm_ = ice_mat("paredao")
    if spec.get("ridge_tex"):
        textured(wm_, dict(spec["ridge_tex"], scale=2.5, bump=0.5))
    wl_.data.materials.append(wm_)
    bpy.ops.object.shade_smooth()

# casco do Borealis preso no gelo: chapa de navio enorme com as texturas metalhull do jogo
# "hull": {"x": centro, "y": face, "len": comprimento, "h": altura, "a": textura, "b": textura, "scale": m por repetição,
#          "bow": curvatura da proa (m em cada ponta), "lean": quanto o alto tomba para trás (m)}
if spec.get("hull"):
    hu = spec["hull"]
    hx_, hy_, hl_, hh_ = hu["x"], hu["y"], hu.get("len", 70), hu.get("h", 16)
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=280, y_subdivisions=90, size=1, location=(hx_, hy_, hh_ / 2 - 1.5))
    hb_ = bpy.context.object
    hb_.name = "casco"
    hb_.rotation_euler = (math.radians(90), 0, 0)
    hb_.scale = (hl_, hh_, 1)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bow_, lean_ = hu.get("bow", 6.0), hu.get("lean", 1.5)
    for v_ in hb_.data.vertices:
        u_ = v_.co.x / (hl_ / 2)
        zt_ = (v_.co.z + hh_ / 2) / hh_
        # o casco faz curva para longe nas pontas, e o costado tomba no alto (a parte de baixo, perto do portal, fica reta)
        v_.co.y += bow_ * u_ * u_ + lean_ * max(0.0, zt_ - 0.3) ** 2
    so_ = hb_.modifiers.new("esp", "SOLIDIFY")
    so_.thickness = 2.0
    so_.offset = -1.0
    hm_ = mat("casco", (0.3, 0.3, 0.3), 0.6)
    textured(hm_, {"a": hu["a"], "b": hu.get("b", hu["a"]), "scale": hu.get("scale", 4.0), "tint": hu.get("tint", (0.8, 0.82, 0.88)),
                   "bump": 0.3, "rough": 0.55, "patch": 0.08})
    # gelo e neve grudados na parte de baixo do casco (some para cima com ruído)
    hn_ = hm_.node_tree.nodes
    bs_ = hn_["Principled BSDF"]
    lk_ = bs_.inputs["Base Color"].links[0].from_socket
    if spec.get("ground_tex"):
        st_ = tex_node(hm_.node_tree, spec["ground_tex"]["a"], 3.0)
        sn_col = st_.outputs["Color"]
    else:
        sn_col = None
    tc_h = hn_.new("ShaderNodeTexCoord")
    gp_ = hn_.new("ShaderNodeNewGeometry")
    sp_ = hn_.new("ShaderNodeSeparateXYZ")
    hm_.node_tree.links.new(gp_.outputs["Position"], sp_.inputs[0])
    nz_ = hn_.new("ShaderNodeTexNoise")
    nz_.inputs["Scale"].default_value = 0.6
    nz_.inputs["Detail"].default_value = 6
    hm_.node_tree.links.new(tc_h.outputs["Object"], nz_.inputs["Vector"])
    ad_ = hn_.new("ShaderNodeMath")
    ad_.operation = "MULTIPLY_ADD"
    ad_.inputs[1].default_value = 2.2
    hm_.node_tree.links.new(nz_.outputs[0], ad_.inputs[0])
    hm_.node_tree.links.new(sp_.outputs[2], ad_.inputs[2])
    mr_ = hn_.new("ShaderNodeMapRange")
    mr_.inputs["From Min"].default_value = hu.get("frost", 1.4) + 1.1
    mr_.inputs["From Max"].default_value = hu.get("frost", 1.4) + 0.5
    hm_.node_tree.links.new(ad_.outputs[0], mr_.inputs["Value"])
    mx_ = hn_.new("ShaderNodeMix")
    mx_.data_type = "RGBA"
    hm_.node_tree.links.new(mr_.outputs[0], mx_.inputs[0])
    hm_.node_tree.links.new(lk_, mx_.inputs[6])
    if sn_col is not None:
        hm_.node_tree.links.new(sn_col, mx_.inputs[7])
    else:
        mx_.inputs[7].default_value = (0.85, 0.9, 1.0, 1)
    hm_.node_tree.links.new(mx_.outputs[2], bs_.inputs["Base Color"])
    hb_.data.materials.append(hm_)
    bpy.ops.object.shade_smooth()
    # amurada no alto do costado: corrimão e balaústres de ferro, seguindo a curva do casco
    rm_ = mat("amurada", (0.05, 0.05, 0.055), 0.5)
    ztop_ = hh_ - 1.5
    def edge_y(x_):
        u_ = (x_ - hx_) / (hl_ / 2)
        return hy_ + bow_ * u_ * u_ + lean_ * 0.49 - 0.3
    for zr_ in (1.1, 0.55):
        cu_ = bpy.data.curves.new("corrimao", "CURVE")
        cu_.dimensions = "3D"
        cu_.bevel_depth = 0.04
        sp2_ = cu_.splines.new("POLY")
        xs_ = [hx_ - hl_ / 2 + k * hl_ / 80 for k in range(81)]
        sp2_.points.add(len(xs_) - 1)
        for k, x_ in enumerate(xs_):
            sp2_.points[k].co = (x_, edge_y(x_), ztop_ + zr_, 1)
        ob_ = bpy.data.objects.new("corrimao", cu_)
        sc.collection.objects.link(ob_)
        ob_.data.materials.append(rm_)
    x_ = hx_ - hl_ / 2
    while x_ < hx_ + hl_ / 2:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=1.15, vertices=8, location=(x_, edge_y(x_), ztop_ + 0.55))
        bpy.context.object.data.materials.append(rm_)
        x_ += 1.6

# objetos do jogo parados (porta do Borealis etc.): [{"mdl", "pos": [x,y,z], "rot": [rx,ry,rz], "scale": 1}]
for pr in spec.get("props", []):
    import addon_utils, os
    addon_utils.enable("SourceIO")
    before_ = set(bpy.data.objects)
    bpy.ops.sourceio.mdl(filepath=pr["mdl"], directory=os.path.dirname(pr["mdl"]) + "/", files=[{"name": os.path.basename(pr["mdl"])}],
                         import_animations=False, import_textures=True, scale=0.0254 * pr.get("scale", 1.0))
    for o_ in set(bpy.data.objects) - before_:
        if o_.parent is None:
            o_.location = V(pr["pos"])
            o_.rotation_euler = [math.radians(r) for r in pr.get("rot", (0, 0, 0))]

# folhas de papel na neve (os arquivos da Mossman): [{"pos": [x, y], "rot": graus, "tex": png, "fly": [q0, q1, dx, dy]}]
# "fly" = o vento leva a folha arrastando e virando pelo chão
for k_, pp in enumerate(spec.get("papers", [])):
    bpy.ops.mesh.primitive_plane_add(size=1)
    pa_ = bpy.context.object
    pa_.scale = (0.21, 0.297, 1)
    bpy.ops.object.transform_apply(scale=True)
    for v in pa_.data.vertices:  # papel nunca fica liso: ondula de leve
        v.co.z = 0.012 * math.sin(v.co.x * 14 + k_) + 0.008 * math.sin(v.co.y * 9)
    sb_ = pa_.modifiers.new("sub", "SUBSURF")
    sb_.subdivision_type = "SIMPLE"  # quina reta (o Catmull-Clark arredondava a folha num oval)
    sb_.levels = sb_.render_levels = 3
    pm_ = bpy.data.materials.new("papel%d" % k_)
    pm_.use_nodes = True
    it_ = pm_.node_tree.nodes.new("ShaderNodeTexImage")
    it_.image = bpy.data.images.load(pp["tex"])
    pb_ = pm_.node_tree.nodes["Principled BSDF"]
    pm_.node_tree.links.new(it_.outputs[0], pb_.inputs["Base Color"])
    pb_.inputs["Roughness"].default_value = 0.9
    if "Subsurface Weight" in pb_.inputs:
        pb_.inputs["Subsurface Weight"].default_value = 0.15
    pa_.data.materials.append(pm_)
    dgp_ = bpy.context.evaluated_depsgraph_get()

    if spec.get("ice_sheet") and k_ == 0:
        sc.frame_set(spec["ice_sheet"].get("open", [1, 1])[1] + 3)
        dgp_ = bpy.context.evaluated_depsgraph_get()
    _ices_p = [o for o in sc.collection.objects if o.name.startswith("gelo_cel")]

    def _gz(x, y):
        # em cima da placa de gelo quando tem placa (senão a folha some embaixo dela)
        h_ = g.evaluated_get(dgp_).ray_cast(g.matrix_world.inverted() @ V((x, y, 50)), V((0, 0, -1)))
        zz = (g.matrix_world @ h_[1]).z if h_[0] else 0
        for ic_ in _ices_p:
            mi_ = ic_.matrix_world.inverted()
            h2 = ic_.evaluated_get(dgp_).ray_cast(mi_ @ V((x, y, 50)), (mi_.to_3x3() @ V((0, 0, -1))).normalized())
            if h2[0]:
                zz = max(zz, (ic_.matrix_world @ h2[1]).z)
        return zz
    x0_, y0_ = pp["pos"]
    pa_.location = (x0_, y0_, _gz(x0_, y0_) + 0.015)
    pa_.rotation_euler = (math.radians(pp.get("tilt", 0)), 0, math.radians(pp.get("rot", 0)))
    if pp.get("fly"):
        q0, q1, dx, dy = pp["fly"]
        rp_ = random.Random(77 + k_)
        pa_.keyframe_insert("location", frame=1)
        pa_.keyframe_insert("rotation_euler", frame=1)
        for fr_ in range(int(q0), int(q1) + 1, 4):
            u = (fr_ - q0) / max(1, q1 - q0)
            xx, yy = x0_ + dx * u, y0_ + dy * u
            pa_.location = (xx, yy, _gz(xx, yy) + 0.02 + 0.35 * abs(math.sin(u * 9 + k_)) * (1 - u * 0.5))
            pa_.rotation_euler = (math.sin(u * 7) * 1.2 + rp_.uniform(-0.2, 0.2), math.cos(u * 5) * 0.8, math.radians(pp.get("rot", 0)) + u * 6)
            pa_.keyframe_insert("location", frame=fr_)
            pa_.keyframe_insert("rotation_euler", frame=fr_)

sc.frame_set(1)
if spec.get("freeze_at"):
    # 03/11 (pedido dele: "deixar as pessoas, os elementos parados e uma câmera lenta que se move em ângulo"): a cena
    # inteira fica na pose do quadro freeze_at (personagens, ilhas, gelo, papéis, luzes) e só a câmera anda
    sc.frame_set(int(spec["freeze_at"]))
    bpy.context.view_layer.update()
    n_fz = 0
    for coll in (bpy.data.objects, bpy.data.materials, bpy.data.worlds, bpy.data.node_groups, bpy.data.shape_keys, bpy.data.lights, bpy.data.meshes):
        for idb in coll:
            if idb.animation_data:
                idb.animation_data_clear()
                n_fz += 1
    print("FREEZE", spec["freeze_at"], n_fz)
# ---------------------------------------------------------------- câmera e render
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.lens = spec.get("lens", 50)
cam.data.clip_end = 2000
sc.collection.objects.link(cam)
cam.location = V(spec["cam"])
cam.rotation_euler = (V(spec["look"]) - cam.location).to_track_quat("-Z", "Y").to_euler()
sc.camera = cam
if N_FR > 1 and spec.get("cam_keys"):
    # trajeto da câmera em vários pontos [quadro, posição, para onde olha] (o Gordon dando uns passos)
    cam.rotation_mode = "QUATERNION"
    for f, cp, lp in spec["cam_keys"]:
        cam.location = V(cp)
        cam.rotation_quaternion = (V(lp) - cam.location).to_track_quat("-Z", "Y")
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_quaternion", frame=f)
    if cam.animation_data and cam.animation_data.action:
        for fc in fcurves_of(cam.animation_data.action):
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.easing = "EASE_IN_OUT"
elif N_FR > 1 and spec.get("cam2"):
    # empurrão lento de câmera do primeiro ao último quadro (suave nas pontas)
    for f, cp, lp in ((1, spec["cam"], spec["look"]), (N_FR, spec["cam2"], spec.get("look2", spec["look"]))):
        cam.location = V(cp)
        cam.rotation_euler = (V(lp) - cam.location).to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
sc.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE_NEXT"
ee = sc.eevee
for k, v in (("use_volumetric_shadows", True), ("volumetric_end", 600.0), ("taa_render_samples", spec.get("samples", 32)), ("use_gtao", True), ("use_shadows", True), ("shadow_ray_count", 3), ("shadow_step_count", 12), ("shadow_resolution_scale", 1.0),
             ("use_fast_gi", True), ("fast_gi_method", "GLOBAL_ILLUMINATION"), ("fast_gi_distance", 2.0), ("fast_gi_resolution", "2")):
    if hasattr(ee, k):
        try:
            setattr(ee, k, v)
        except Exception:
            pass
sc.render.resolution_x, sc.render.resolution_y = spec.get("res", [1920, 1080])
sc.view_settings.view_transform = "AgX"
sc.view_settings.exposure = spec.get("exposure", 0.0)
for f_, ev_ in spec.get("exposure_keys", []):
    sc.view_settings.exposure = ev_
    sc.view_settings.keyframe_insert("exposure", frame=f_)
looks = [x.identifier for x in bpy.types.ColorManagedViewSettings.bl_rna.properties["look"].enum_items]
for lk in ("AgX - Medium High Contrast", "AgX - Base Contrast"):
    if lk in looks:
        sc.view_settings.look = lk
        break
kuw = spec.get("kuwahara", 7)
if kuw > 0:
    tree = bpy.data.node_groups.new("paint", "CompositorNodeTree")
    sc.compositing_node_group = tree
    rl = tree.nodes.new("CompositorNodeRLayers")
    kn = tree.nodes.new("CompositorNodeKuwahara")
    try:
        kn.variation = "ANISOTROPIC"
    except Exception:
        pass
    for inp in kn.inputs:
        if inp.name.lower() == "size":
            inp.default_value = kuw
    outn = tree.nodes.new("NodeGroupOutput")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    src_ = rl.outputs["Image"]
    if spec.get("glow", 0) > 0:
        gl = tree.nodes.new("CompositorNodeGlare")
        for k_, v_ in (("glare_type", "FOG_GLOW"), ("quality", "HIGH"), ("size", 8), ("threshold", 0.7)):
            try:
                setattr(gl, k_, v_)
            except Exception:
                pass
        for inp in gl.inputs:
            nm2 = inp.name.lower()
            try:
                if nm2 == "type":
                    inp.default_value = "Fog Glow"
                elif nm2 == "threshold":
                    inp.default_value = 0.7
                elif nm2 == "strength":
                    inp.default_value = spec["glow"]
                elif nm2 == "size":
                    inp.default_value = 0.7
            except Exception:
                pass
        tree.links.new(src_, gl.inputs[0])
        src_ = gl.outputs[0]
    tree.links.new(src_, kn.inputs[0])
    tree.links.new(kn.outputs[0], outn.inputs[0])
sc.render.filepath = out
if spec.get("blend"):
    bpy.ops.wm.save_as_mainfile(filepath=spec["blend"])
def inside(tb, pt):
    # dentro de verdade: um raio saindo do ponto cruza a superfície do outro um número ímpar de vezes (em 3 direções, maioria)
    votes = 0
    for dr in (V((0.31, 0.17, 0.93)), V((-0.6, 0.7, -0.38)), V((0.2, -0.9, 0.4))):
        n_, o_ = 0, pt.copy()
        for _ in range(40):
            loc, nrm, idx, dist = tb.ray_cast(o_, dr, 3.0)
            if loc is None:
                break
            n_ += 1
            o_ = loc + dr * 0.0005
        votes += n_ % 2
    return votes >= 2


def check_frame(fr_):
    # verificação automática: um corpo entrando no outro (por osso, com profundidade), pés fora do chão
    from mathutils.bvhtree import BVHTree
    dg_ = bpy.context.evaluated_depsgraph_get()
    geo = {}
    for nm_, (arm_, piv_, ch_) in CH_OBJ.items():
        vs, tris, owner = [], [], []
        for o in [o for o in bpy.data.objects if o.type == "MESH" and not o.hide_render and o.find_armature() == arm_]:
            ev = o.evaluated_get(dg_)
            mm = ev.to_mesh()
            base = len(vs)
            gnames = {g.index: g.name for g in o.vertex_groups}
            for v in mm.vertices:
                vs.append(o.matrix_world @ v.co)
                owner.append(gnames.get(max(v.groups, key=lambda g_: g_.weight).group, "?") if len(v.groups) else "?")
            mm.calc_loop_triangles()
            tris += [tuple(base + i for i in t.vertices) for t in mm.loop_triangles]
            ev.to_mesh_clear()
        if vs:
            geo[nm_] = (vs, owner, BVHTree.FromPolygons(vs, tris))
    bad = []
    for a_, (vs, owner, _) in geo.items():
        zmin = min(v.z for v in vs)
        hit = g.evaluated_get(dg_).ray_cast(g.matrix_world.inverted() @ V((vs[0].x, vs[0].y, 50)), V((0, 0, -1)))
        gz_ = (g.matrix_world @ hit[1]).z if hit[0] else 0
        if abs(zmin - gz_) > 0.04:
            bad.append("%s %s do chão (%.0f cm)" % (a_, "flutuando" if zmin > gz_ else "afundado", abs(zmin - gz_) * 100))
        for b_, (_, _, tb) in geo.items():
            if a_ == b_:
                continue
            per = {}
            for i in range(0, len(vs), 3):
                loc, nrm, _, d = tb.find_nearest(vs[i], 0.25)
                if loc is not None and d > 0.02 and (vs[i] - loc).dot(nrm) < 0 and inside(tb, vs[i]):
                    k = owner[i]
                    per[k] = max(per.get(k, 0), d)
            for k, d in sorted(per.items(), key=lambda x: -x[1])[:6]:
                bad.append("%s/%s dentro de %s (%.0f cm)" % (a_, k, b_, d * 100))
    pos_ = []
    for nm_, (arm_, piv_, ch_) in CH_OBJ.items():
        if arm_ and "pelvis" in arm_.pose.bones and "head" in arm_.pose.bones:
            pv_, hd_ = arm_.matrix_world @ arm_.pose.bones["pelvis"].head, arm_.matrix_world @ arm_.pose.bones["head"].head
            pos_.append("%s pelve(%.2f,%.2f) cabeça(%.2f,%.2f,%.2f)" % (nm_, pv_.x, pv_.y, hd_.x, hd_.y, hd_.z))
    print("POS", fr_, " ".join(pos_))
    print("CHECK", fr_, "OK" if not bad else " | ".join(bad))


def penetration(frames, skip=("dog",)):
    # nota de sobreposição: soma das profundidades (cm) dos vértices de um corpo dentro do outro
    from mathutils.bvhtree import BVHTree
    tot = 0.0
    for fr_ in frames:
        sc.frame_set(fr_)
        dg_ = bpy.context.evaluated_depsgraph_get()
        geo = {}
        for nm_, (arm_, piv_, ch_) in CH_OBJ.items():
            if nm_ in skip:
                continue
            vs, tris = [], []
            for o in [o for o in bpy.data.objects if o.type == "MESH" and not o.hide_render and o.find_armature() == arm_]:
                ev = o.evaluated_get(dg_)
                mm = ev.to_mesh()
                base = len(vs)
                vs += [o.matrix_world @ v.co for v in mm.vertices]
                mm.calc_loop_triangles()
                tris += [tuple(base + i for i in t.vertices) for t in mm.loop_triangles]
                ev.to_mesh_clear()
            geo[nm_] = (vs, BVHTree.FromPolygons(vs, tris))
        for a_, (vs, _) in geo.items():
            for b_, (_, tb) in geo.items():
                if a_ == b_:
                    continue
                for i in range(0, len(vs), 4):
                    loc, nrm, _, d = tb.find_nearest(vs[i], 0.3)
                    if loc is not None and d > 0.012 and (vs[i] - loc).dot(nrm) < 0 and inside(tb, vs[i]):
                        tot += d * 100
    return tot


if spec.get("optimize"):
    # procura sozinho: posição dela e onde cada mão pousa, até ninguém atravessar ninguém
    opt = spec["optimize"]
    frames = opt["frames"]
    a_arm, a_piv, a_ch = CH_OBJ[opt["move"]]
    base_loc = a_piv.location.copy()
    params = {"dx": 0.0, "dy": 0.0}
    for nm_, k, tgt, o_piv in IK_T:
        params["%s.%s.lat" % (nm_, k["hand"])] = 0.0
        params["%s.%s.back" % (nm_, k["hand"])] = 0.0
        params["%s.%s.up" % (nm_, k["hand"])] = 0.0
    tg0 = {id(t[2]): t[2].location.copy() for t in IK_T}
    sc.frame_set(frames[0])

    def apply(P):
        a_piv.location = base_loc + V((P["dx"], P["dy"], 0))
        bpy.context.view_layer.update()
        for nm_, k, tgt, o_piv in IK_T:
            key = "%s.%s." % (nm_, k["hand"])
            dw = frame_of(o_piv, (P[key + "lat"], P[key + "back"], P[key + "up"]))
            # o alvo é filho do osso do outro: converte o deslocamento do mundo para o espaço local dele
            pm = (tgt.matrix_world @ tgt.matrix_basis.inverted()).to_3x3()
            tgt.location = tg0[id(tgt)] + pm.inverted() @ dw
        bpy.context.view_layer.update()

    best = penetration(frames)
    print("OPT inicio", round(best))
    steps = opt.get("steps", [0.06, 0.03, 0.015])
    for st in steps:
        improved = True
        while improved:
            improved = False
            for key in list(params):
                for sgn in (1, -1):
                    P = dict(params)
                    P[key] += sgn * st
                    if abs(P[key]) > opt.get("limit", 0.2):
                        continue
                    apply(P)
                    sc_ = penetration(frames)
                    if sc_ < best - 0.5:
                        best, params, improved = sc_, P, True
                        print("OPT", round(best), key, round(P[key], 3))
                        break
    apply(params)
    print("OPT fim", round(best), json.dumps({k: round(v, 3) for k, v in params.items()}))
    sys.exit(0)

if spec.get("check"):
    for fr_ in spec["check"]:
        sc.frame_set(fr_)
        check_frame(fr_)
    if spec.get("check_only"):
        sys.exit(0)
if spec.get("stills"):
    # só alguns quadros soltos (para conferir a coreografia sem gravar tudo)
    for fr_ in spec["stills"]:
        sc.frame_set(fr_)
        for nm_, (arm_, piv_, ch_) in CH_OBJ.items():
            pbs = arm_.pose.bones if arm_ else {}
            if "leg_upper_L" in pbs:
                v_ = (arm_.matrix_world @ pbs["leg_upper_R"].head) - (arm_.matrix_world @ pbs["leg_upper_L"].head)
                sh_ = (arm_.matrix_world @ pbs["arm_upper_R"].head) - (arm_.matrix_world @ pbs["arm_upper_L"].head)
                hp = arm_.matrix_world @ pbs["pelvis"].head
                # frente = esquerda->direita girado 90 graus (para quem olha -Y, esq->dir = -X)
                print("FACE", fr_, nm_, "quadril %.0f" % math.degrees(math.atan2(v_.x, -v_.y)), "ombros %.0f" % math.degrees(math.atan2(sh_.x, -sh_.y)), "pelve %.2f %.2f" % (hp.x, hp.y))
            for bn_ in ("ValveBiped.Bip01_L_Hand", "ValveBiped.Bip01_R_Hand", "ValveBiped.Bip01_Pelvis", "ValveBiped.Bip01_Head1", "ValveBiped.Bip01_L_Foot", "ValveBiped.Bip01_L_Toe0", "ValveBiped.Bip01_R_Foot", "ValveBiped.Bip01_R_Toe0"):
                if bn_ in pbs:
                    hp_ = arm_.matrix_world @ pbs[bn_].head
                    print("BONE", fr_, nm_, bn_, "%.2f %.2f %.2f" % tuple(hp_))
        sc.render.filepath = out.rstrip("/\\") + "/s_%04d.png" % fr_
        bpy.ops.render.render(write_still=True)
elif N_FR > 1:
    if spec.get("range"):
        sc.frame_start, sc.frame_end = spec["range"]
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = out.rstrip("/\\") + "/f_"
    bpy.ops.render.render(animation=True)
else:
    bpy.ops.render.render(write_still=True)
