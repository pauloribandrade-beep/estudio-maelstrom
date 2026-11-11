# Converte um modelo do Half-Life 1 (GoldSrc .mdl, versão 10) em .glb com esqueleto, pele e todas as animações.
# Uso: python tools/hl1/mdl2glb.py <entrada.mdl> <saida.glb> [--list]
# Lê do jogo instalado (os .mdl ficam em Half-Life/valve ou valve_hd/models). Texturas: as do próprio .mdl ou do <nome>T.mdl.
# Coordenadas: o HL é Z para cima, em polegadas; o glb sai Y para cima (nó raiz girado) e na escala do jogo (1 = 1 polegada).
import io, json, math, os, struct, sys
from PIL import Image


def rd(fmt, b, o):
    return struct.unpack_from(fmt, b, o)


def cstr(b, o, n):
    return b[o:o + n].split(b"\0")[0].decode("latin-1")


def quat(a):
    # AngleQuaternion do studio (a = x, y, z em radianos)
    sr, cr = math.sin(a[0] / 2), math.cos(a[0] / 2)
    sp, cp = math.sin(a[1] / 2), math.cos(a[1] / 2)
    sy, cy = math.sin(a[2] / 2), math.cos(a[2] / 2)
    return [sr * cp * cy - cr * sp * sy, cr * sp * cy + sr * cp * sy, cr * cp * sy - sr * sp * cy, cr * cp * cy + sr * sp * sy]


def qmat(q, t):
    x, y, z, w = q
    return [
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), t[0]],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), t[1]],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y), t[2]],
        [0, 0, 0, 1],
    ]


def mmul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]


def minv_rigid(m):
    r = [[m[j][i] for j in range(3)] for i in range(3)]
    t = [-(r[i][0] * m[0][3] + r[i][1] * m[1][3] + r[i][2] * m[2][3]) for i in range(3)]
    return [r[0] + [t[0]], r[1] + [t[1]], r[2] + [t[2]], [0, 0, 0, 1]]


def xf(m, v, w=1.0):
    return [m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2] + m[i][3] * w for i in range(3)]


class MDL:
    def __init__(self, path):
        b = open(path, "rb").read()
        self.b = b
        assert b[:4] == b"IDST" and rd("<i", b, 4)[0] == 10, "não é um .mdl do HL1"
        H = rd("<27i", b, 140)
        (nb, bi, nbc, bci, nhb, hbi, nseq, seqi, nsg, sgi, ntex, texi, texdi, nskr, nskf, ski, nbp, bpi) = H[:18]
        self.bones = []
        for i in range(nb):
            o = bi + i * 112
            name = cstr(b, o, 32)
            parent, flags = rd("<2i", b, o + 32)
            val = rd("<6f", b, o + 64)
            sc = rd("<6f", b, o + 88)
            self.bones.append({"name": name, "parent": parent, "value": val, "scale": sc})
        self.seqs = []
        for i in range(nseq):
            o = seqi + i * 176
            label = cstr(b, o, 32)
            fps, = rd("<f", b, o + 32)
            numframes, = rd("<i", b, o + 56)
            numblends, animindex = rd("<2i", b, o + 120)
            seqgroup, = rd("<i", b, o + 156)
            self.seqs.append({"label": label, "fps": fps, "frames": numframes, "animindex": animindex, "group": seqgroup, "blends": numblends})
        # texturas (podem estar no nomeT.mdl)
        tb, tntex, ttexi, tski, tnskr = b, ntex, texi, ski, nskr
        if ntex == 0:
            tp = path[:-4] + "t.mdl"
            if not os.path.exists(tp):
                tp = path[:-4] + "T.mdl"
            tb = open(tp, "rb").read()
            T = rd("<27i", tb, 140)
            tntex, ttexi, tnskr, tski = T[9], T[10], T[12], T[14]
        self.textures = []
        for i in range(tntex):
            o = ttexi + i * 80
            name = cstr(tb, o, 64)
            flags, w, h, idx = rd("<4i", tb, o + 64)
            pix = tb[idx:idx + w * h]
            pal = tb[idx + w * h: idx + w * h + 768]
            im = Image.frombytes("P", (w, h), pix)
            im.putpalette(pal)
            rgba = im.convert("RGBA")
            if flags & 0x40:  # masked: o último índice da paleta é transparente
                px = rgba.load()
                for y in range(h):
                    for x in range(w):
                        if pix[y * w + x] == 255:
                            px[x, y] = (0, 0, 0, 0)
            self.textures.append({"name": name, "flags": flags, "w": w, "h": h, "img": rgba})
        self.skins = [rd("<h", tb, tski + 2 * k)[0] for k in range(tnskr)]
        # partes do corpo: usa o primeiro submodelo de cada parte
        self.meshes = []
        for i in range(nbp):
            o = bpi + i * 76
            nmodels, base, modelindex = rd("<3i", b, o + 64)
            mo = modelindex  # submodelo 0
            nmesh, meshindex, nverts, vinfoi, verti, nnorms, ninfoi, normi = rd("<8i", b, mo + 72)
            vbone = b[vinfoi:vinfoi + nverts]
            verts = [rd("<3f", b, verti + 12 * k) for k in range(nverts)]
            nbone = b[ninfoi:ninfoi + nnorms]
            norms = [rd("<3f", b, normi + 12 * k) for k in range(nnorms)]
            for m in range(nmesh):
                mo2 = meshindex + m * 20
                ntris, trii, skinref, _, _ = rd("<5i", b, mo2)
                tris = []
                p = trii
                while True:
                    cnt, = rd("<h", b, p)
                    p += 2
                    if cnt == 0:
                        break
                    fan = cnt < 0
                    cnt = abs(cnt)
                    vs = []
                    for k in range(cnt):
                        vi, ni, s, t = rd("<4h", b, p)
                        p += 8
                        vs.append((vi, ni, s, t))
                    for k in range(2, cnt):
                        if fan:
                            tris.append((vs[0], vs[k - 1], vs[k]))
                        elif k % 2:
                            tris.append((vs[k - 1], vs[k - 2], vs[k]))
                        else:
                            tris.append((vs[k - 2], vs[k - 1], vs[k]))
                self.meshes.append({"tex": self.skins[skinref] if skinref < len(self.skins) else skinref, "tris": tris, "verts": verts, "vbone": vbone, "norms": norms, "nbone": nbone})
        self.groups = []
        for i in range(nsg):
            o = sgi + i * 104
            self.groups.append(cstr(b, o + 32, 64))
        self.path = path

    def anim(self, seq, frame, blend=0):
        # devolve (pos, ang) por osso no quadro pedido
        if seq["group"] == 0:
            b = self.b
            base = seq["animindex"]
        else:
            gp = os.path.join(os.path.dirname(self.path), os.path.basename(self.path)[:-4] + "%02d.mdl" % seq["group"])
            b = self._grp(gp)
            base = seq["animindex"]
        nb = len(self.bones)
        base += blend * nb * 12
        out = []
        for i, bone in enumerate(self.bones):
            ao = base + i * 12
            offs = rd("<6H", b, ao)
            v = []
            for j in range(6):
                val = bone["value"][j]
                if offs[j]:
                    p = ao + offs[j]
                    k = frame
                    while True:
                        valid, total = b[p], b[p + 1]
                        if total > k:
                            break
                        k -= total
                        p += (valid + 1) * 2
                    if valid > k:
                        raw, = rd("<h", b, p + (k + 1) * 2)
                    else:
                        raw, = rd("<h", b, p + valid * 2)
                    val += raw * bone["scale"][j]
                v.append(val)
            out.append((v[:3], v[3:]))
        return out

    _gc = {}

    def _grp(self, p):
        if p not in self._gc:
            self._gc[p] = open(p, "rb").read()
        return self._gc[p]


def build(mdl, out):
    bones = mdl.bones
    nb = len(bones)
    pose = mdl.anim(mdl.seqs[0], 0)
    local = [qmat(quat(a), t) for t, a in pose]
    world = [None] * nb
    for i, bn in enumerate(bones):
        world[i] = local[i] if bn["parent"] < 0 else mmul(world[bn["parent"]], local[i])
    ibm = [minv_rigid(m) for m in world]

    bin_ = bytearray()
    views, accs = [], []

    def add(data, comp, typ, count, target=None, mn=None, mx=None):
        while len(bin_) % 4:
            bin_.append(0)
        off = len(bin_)
        bin_.extend(data)
        v = {"buffer": 0, "byteOffset": off, "byteLength": len(data)}
        if target:
            v["target"] = target
        views.append(v)
        a = {"bufferView": len(views) - 1, "componentType": comp, "count": count, "type": typ}
        if mn is not None:
            a["min"], a["max"] = mn, mx
        accs.append(a)
        return len(accs) - 1

    images, textures, materials = [], [], []
    for t in mdl.textures:
        buf = io.BytesIO()
        t["img"].save(buf, "PNG")
        data = buf.getvalue()
        while len(bin_) % 4:
            bin_.append(0)
        off = len(bin_)
        bin_.extend(data)
        views.append({"buffer": 0, "byteOffset": off, "byteLength": len(data)})
        images.append({"bufferView": len(views) - 1, "mimeType": "image/png", "name": t["name"]})
        textures.append({"source": len(images) - 1, "sampler": 0})
        mat = {"name": t["name"], "pbrMetallicRoughness": {"baseColorTexture": {"index": len(textures) - 1}, "metallicFactor": 0, "roughnessFactor": 0.9}, "doubleSided": True}
        if t["flags"] & 0x40:
            mat["alphaMode"] = "MASK"
        materials.append(mat)

    # agrupa os triângulos por textura
    byTex = {}
    for m in mdl.meshes:
        byTex.setdefault(m["tex"], []).append(m)
    prims = []
    for tex, ms in byTex.items():
        P, N, UV, J, W, I = [], [], [], [], [], []
        tw, th = (mdl.textures[tex]["w"], mdl.textures[tex]["h"]) if tex < len(mdl.textures) else (1, 1)
        for m in ms:
            for tri in m["tris"]:
                for vi, ni, s, t in tri:
                    bi_ = m["vbone"][vi]
                    p = xf(world[bi_], m["verts"][vi])
                    nbi = m["nbone"][ni] if ni < len(m["nbone"]) else bi_
                    n = xf(world[nbi], m["norms"][ni], 0.0)
                    ln = math.sqrt(sum(c * c for c in n)) or 1
                    P.append(p)
                    N.append([c / ln for c in n])
                    UV.append([s / tw, t / th])
                    J.append([bi_, 0, 0, 0])
                    W.append([1, 0, 0, 0])
        # o HL tem o sentido dos triângulos invertido em relação ao glTF
        idx = []
        for k in range(0, len(P), 3):
            idx += [k, k + 2, k + 1]
        pa = add(struct.pack("<%df" % (3 * len(P)), *[c for v in P for c in v]), 5126, "VEC3", len(P), 34962, [min(v[i] for v in P) for i in range(3)], [max(v[i] for v in P) for i in range(3)])
        na = add(struct.pack("<%df" % (3 * len(N)), *[c for v in N for c in v]), 5126, "VEC3", len(N), 34962)
        ua = add(struct.pack("<%df" % (2 * len(UV)), *[c for v in UV for c in v]), 5126, "VEC2", len(UV), 34962)
        ja = add(struct.pack("<%dH" % (4 * len(J)), *[c for v in J for c in v]), 5123, "VEC4", len(J), 34962)
        wa = add(struct.pack("<%df" % (4 * len(W)), *[c for v in W for c in v]), 5126, "VEC4", len(W), 34962)
        ia = add(struct.pack("<%dI" % len(idx), *idx), 5125, "SCALAR", len(idx), 34963)
        prims.append({"attributes": {"POSITION": pa, "NORMAL": na, "TEXCOORD_0": ua, "JOINTS_0": ja, "WEIGHTS_0": wa}, "indices": ia, "material": materials and min(tex, len(materials) - 1)})

    nodes = [{"name": "hl1_root", "rotation": [-math.sqrt(0.5), 0, 0, math.sqrt(0.5)], "children": []}]
    first = len(nodes)
    for i, bn in enumerate(bones):
        t, a = pose[i]
        nodes.append({"name": bn["name"], "translation": list(t), "rotation": quat(a), "children": []})
    for i, bn in enumerate(bones):
        if bn["parent"] < 0:
            nodes[0]["children"].append(first + i)
        else:
            nodes[first + bn["parent"]]["children"].append(first + i)
    for n in nodes:
        if not n["children"]:
            del n["children"]
    ibma = add(struct.pack("<%df" % (16 * nb), *[m[r][c] for m in ibm for c in range(4) for r in range(4)]), 5126, "MAT4", nb)
    mesh_node = len(nodes)
    nodes.append({"name": "body", "mesh": 0, "skin": 0})
    nodes[0].setdefault("children", []).append(mesh_node)

    anims = []
    keep = None
    if "--anims" in sys.argv:
        keep = set(sys.argv[sys.argv.index("--anims") + 1].split(","))
    for s in mdl.seqs:
        if keep is not None and s["label"] not in keep:
            continue
        nf = max(1, s["frames"])
        fps = s["fps"] or 30
        times = [k / fps for k in range(nf)]
        ta = add(struct.pack("<%df" % nf, *times), 5126, "SCALAR", nf, None, [0], [times[-1]])
        frames = [mdl.anim(s, k) for k in range(nf)]
        samplers, channels = [], []
        for i in range(nb):
            tr = [c for k in range(nf) for c in frames[k][i][0]]
            rq = [c for k in range(nf) for c in quat(frames[k][i][1])]
            a1 = add(struct.pack("<%df" % len(tr), *tr), 5126, "VEC3", nf)
            a2 = add(struct.pack("<%df" % len(rq), *rq), 5126, "VEC4", nf)
            samplers += [{"input": ta, "output": a1, "interpolation": "LINEAR"}, {"input": ta, "output": a2, "interpolation": "LINEAR"}]
            channels += [{"sampler": len(samplers) - 2, "target": {"node": first + i, "path": "translation"}}, {"sampler": len(samplers) - 1, "target": {"node": first + i, "path": "rotation"}}]
        anims.append({"name": s["label"], "samplers": samplers, "channels": channels})

    gl = {
        "asset": {"version": "2.0", "generator": "mdl2glb (HL1)"},
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": nodes,
        "meshes": [{"name": "body", "primitives": prims}],
        "skins": [{"joints": list(range(first, first + nb)), "inverseBindMatrices": ibma, "skeleton": first}],
        "animations": anims, "accessors": accs, "bufferViews": views,
        "buffers": [{"byteLength": len(bin_)}],
        "materials": materials, "textures": textures, "images": images,
        "samplers": [{"magFilter": 9728, "minFilter": 9728}],
    }
    js = json.dumps(gl, separators=(",", ":")).encode()
    while len(js) % 4:
        js += b" "
    while len(bin_) % 4:
        bin_.append(0)
    total = 12 + 8 + len(js) + 8 + len(bin_)
    with open(out, "wb") as fo:
        fo.write(struct.pack("<3I", 0x46546C67, 2, total))
        fo.write(struct.pack("<2I", len(js), 0x4E4F534A) + js)
        fo.write(struct.pack("<2I", len(bin_), 0x004E4942) + bytes(bin_))


# nomes de osso do Biped antigo (player/gordon) -> do Biped novo (scientist, gman)
ALIAS = {"Leg": "Thigh", "Leg1": "Calf", "Arm": "Clavicle", "Arm1": "UpperArm", "Arm2": "Forearm"}


def borrow(mdl, spec):
    # --pose-from outro.mdl:seq:novo  copia a rotação de cada osso de mesmo nome (e a posição da raiz) de outro modelo
    path, label, newname = spec.rsplit(":", 2)
    src = MDL(path)
    s = next(x for x in src.seqs if x["label"] == label)
    names = [b["name"] for b in src.bones]

    def srcname(n):
        parts = n.split(" ")
        if len(parts) >= 3 and parts[2] in ALIAS:
            parts[2] = ALIAS[parts[2]]
        return " ".join(parts)

    idx = [names.index(srcname(b["name"])) if srcname(b["name"]) in names else -1 for b in mdl.bones]
    own = mdl.anim(mdl.seqs[0], 0)
    seq = {"label": newname, "fps": s["fps"], "frames": s["frames"], "borrowed": True}
    cache = {}
    orig = mdl.anim

    def anim(sq, frame, blend=0):
        if not sq.get("borrowed"):
            return orig(sq, frame, blend)
        if frame not in cache:
            fr = src.anim(s, frame)
            out = []
            for i, j in enumerate(idx):
                if j < 0:
                    out.append(own[i])
                elif mdl.bones[i]["parent"] < 0:
                    out.append(fr[j])
                else:
                    out.append((own[i][0], fr[j][1]))
            cache[frame] = out
        return cache[frame]

    mdl.anim = anim
    mdl.seqs.append(seq)


def graft(mdl, spec):
    # --graft outro.mdl:textura  troca a cabeça (malhas presas ao osso Bip01 Head) pela malha daquela textura do outro modelo;
    # os vértices do HL ficam no espaço local do osso, então basta reapontar cada vértice para o osso de mesmo nome
    path, tex = spec.rsplit(":", 1)
    src = MDL(path)
    names = [b["name"] for b in mdl.bones]
    snames = [b["name"] for b in src.bones]
    head = names.index("Bip01 Head")
    keep = []
    for me in mdl.meshes:
        vb = [me["vbone"][v[0]] for tri in me["tris"] for v in tri]
        if vb and sum(1 for x in vb if x == head) * 2 < len(vb):
            keep.append(me)
    for me in src.meshes:
        if src.textures[me["tex"]]["name"].lower() != tex.lower():
            continue
        remap = lambda arr: bytes(names.index(snames[x]) if snames[x] in names else head for x in arr)
        mdl.textures.append(src.textures[me["tex"]])
        keep.append({**me, "tex": len(mdl.textures) - 1, "vbone": remap(me["vbone"]), "nbone": remap(me["nbone"])})
    mdl.meshes = keep


if __name__ == "__main__":
    m = MDL(sys.argv[1])
    if "--graft" in sys.argv:
        graft(m, sys.argv[sys.argv.index("--graft") + 1])
    if "--tex-img" in sys.argv:  # --tex-img textura=arquivo.png  troca a imagem (as UVs seguem pelo tamanho original)
        name, img = sys.argv[sys.argv.index("--tex-img") + 1].split("=", 1)
        for t in m.textures:
            if t["name"].lower() == name.lower():
                t["img"] = Image.open(img).convert("RGBA")
    if "--pose-from" in sys.argv:
        borrow(m, sys.argv[sys.argv.index("--pose-from") + 1])
    print(len(m.bones), "ossos ·", len(m.meshes), "malhas ·", len(m.textures), "texturas ·", len(m.seqs), "animações")
    if "--list" in sys.argv:
        for i, s in enumerate(m.seqs):
            print(i, s["label"], s["frames"], "quadros", s["fps"], "fps", "grupo", s["group"])
    if len(sys.argv) > 2 and not sys.argv[2].startswith("--"):  # [--anims a,b,c] limita as animações exportadas
        build(m, sys.argv[2])
        print("ok ->", sys.argv[2], os.path.getsize(sys.argv[2]) // 1024, "KB")
