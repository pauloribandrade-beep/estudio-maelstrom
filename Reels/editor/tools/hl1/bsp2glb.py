# Converte um mapa do Half-Life 1 (GoldSrc .bsp, versão 30) em .glb: o mundo e cada entidade de pincel (*N) como nós
# separados, texturas do próprio .bsp ou dos .wad, e a luz original do jogo (lightmap) como cor de vértice.
# Também grava <saida>.json com as entidades (classname, targetname, origin, model, target...) para achar trilhos, portas, etc.
# Uso: python tools/hl1/bsp2glb.py <mapa.bsp> <saida.glb> <pasta_dos_wads> [--models 0,12,13]
import io, json, math, os, struct, sys
from PIL import Image

SKIP = {"sky", "aaatrigger", "clip", "origin", "null", "hint", "skip", "bevel", "black"}


def rd(fmt, b, o):
    return struct.unpack_from(fmt, b, o)


def wad_index(folder):
    idx = {}
    for fn in os.listdir(folder):
        if not fn.lower().endswith(".wad"):
            continue
        b = open(os.path.join(folder, fn), "rb").read()
        if b[:4] not in (b"WAD3", b"WAD2"):
            continue
        n, ofs = rd("<2i", b, 4)
        for i in range(n):
            o = ofs + i * 32
            pos, dsz, sz, typ, comp = rd("<3iBB", b, o)
            name = b[o + 16:o + 32].split(b"\0")[0].decode("latin-1").lower()
            if typ == 0x43:
                idx.setdefault(name, (b, pos))
    return idx


def miptex_img(b, o, name):
    w, h = rd("<2I", b, o + 16)
    offs = rd("<4I", b, o + 24)
    pix = b[o + offs[0]:o + offs[0] + w * h]
    pal_o = o + offs[3] + (w // 8) * (h // 8) + 2
    pal = b[pal_o:pal_o + 768]
    im = Image.frombytes("P", (w, h), pix)
    im.putpalette(pal)
    rgba = im.convert("RGBA")
    if name.startswith("{"):
        px = rgba.load()
        for y in range(h):
            for x in range(w):
                if pix[y * w + x] == 255:
                    px[x, y] = (0, 0, 0, 0)
    return rgba


def main():
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    src, out, wads = a[0], a[1], a[2]
    only = None
    if "--models" in sys.argv:
        only = set(int(x) for x in sys.argv[sys.argv.index("--models") + 1].split(","))
    b = open(src, "rb").read()
    ver, = rd("<i", b, 0)
    assert ver == 30, "não é um bsp do HL1"
    L = [rd("<2i", b, 4 + 8 * i) for i in range(15)]
    lump = lambda i: (L[i][0], L[i][1])
    ent_txt = b[L[0][0]:L[0][0] + L[0][1]].decode("latin-1", "replace")
    ents, cur = [], None
    for line in ent_txt.splitlines():
        line = line.strip()
        if line == "{":
            cur = {}
        elif line == "}":
            ents.append(cur)
            cur = None
        elif line.startswith('"') and cur is not None:
            parts = line.split('"')
            if len(parts) >= 4:
                cur[parts[1]] = parts[3]
    o, n = lump(3)
    V = [rd("<3f", b, o + 12 * i) for i in range(n // 12)]
    o, n = lump(12)
    E = [rd("<2H", b, o + 4 * i) for i in range(n // 4)]
    o, n = lump(13)
    SE = list(rd("<%di" % (n // 4), b, o))
    o, n = lump(6)
    TI = []
    for i in range(n // 40):
        v = rd("<8f2i", b, o + 40 * i)
        TI.append((v[0:4], v[4:8], v[8], v[9]))
    o, n = lump(7)
    F = []
    for i in range(n // 20):
        plane, side, fe, ne, ti = rd("<HHiHH", b, o + 20 * i)
        styles = b[o + 20 * i + 12:o + 20 * i + 16]
        lo, = rd("<i", b, o + 20 * i + 16)
        F.append((fe, ne, ti, styles, lo))
    lo0, ln = lump(8)
    LIGHT = b[lo0:lo0 + ln]
    o, n = lump(14)
    M = []
    for i in range(n // 64):
        v = rd("<9f4i3i", b, o + 64 * i)
        M.append({"mins": v[0:3], "maxs": v[3:6], "origin": v[6:9], "firstface": v[14], "numfaces": v[15]})
    # texturas
    to, tn = lump(2)
    nt, = rd("<i", b, to)
    toffs = rd("<%di" % nt, b, to + 4)
    W = wad_index(wads)
    TEX = []
    for i in range(nt):
        mo = to + toffs[i]
        name = b[mo:mo + 16].split(b"\0")[0].decode("latin-1")
        w, h = rd("<2I", b, mo + 16)
        o0, = rd("<I", b, mo + 24)
        img = None
        lname = name.lower()
        try:
            if o0:
                img = miptex_img(b, mo, lname)
            elif lname in W:
                wb, wp = W[lname]
                img = miptex_img(wb, wp, lname)
        except Exception:
            img = None
        TEX.append({"name": name, "w": w, "h": h, "img": img})

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
        acc = {"bufferView": len(views) - 1, "componentType": comp, "count": count, "type": typ}
        if mn is not None:
            acc["min"], acc["max"] = mn, mx
        accs.append(acc)
        return len(accs) - 1

    images, textures, materials, matOf = [], [], [], {}

    def material(ti):
        if ti in matOf:
            return matOf[ti]
        t = TEX[ti]
        mat = {"name": t["name"], "pbrMetallicRoughness": {"metallicFactor": 0, "roughnessFactor": 1}, "doubleSided": False}
        if t["img"] is not None:
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
            mat["pbrMetallicRoughness"]["baseColorTexture"] = {"index": len(textures) - 1}
        if t["name"].startswith("{"):
            mat["alphaMode"] = "MASK"
            mat["doubleSided"] = True
        materials.append(mat)
        matOf[ti] = len(materials) - 1
        return matOf[ti]

    meshes, nodes = [], [{"name": "hl1_map", "rotation": [-math.sqrt(0.5), 0, 0, math.sqrt(0.5)], "children": []}]
    for mi, model in enumerate(M):
        if only is not None and mi not in only:
            continue
        groups = {}
        for fi in range(model["firstface"], model["firstface"] + model["numfaces"]):
            fe, ne, tii, styles, lofs = F[fi]
            vecs_s, vecs_t, miptex, flags = TI[tii]
            tname = TEX[miptex]["name"].lower()
            if tname in SKIP or tname.startswith("sky"):
                continue
            pts = []
            for k in range(ne):
                se = SE[fe + k]
                pts.append(V[E[se][0]] if se >= 0 else V[E[-se][1]])
            ss = [sum(p[j] * vecs_s[j] for j in range(3)) + vecs_s[3] for p in pts]
            ts = [sum(p[j] * vecs_t[j] for j in range(3)) + vecs_t[3] for p in pts]
            # o lightmap da face (estilo 0)
            bmin_s, bmin_t = math.floor(min(ss) / 16), math.floor(min(ts) / 16)
            smax = math.ceil(max(ss) / 16) - bmin_s + 1
            tmax = math.ceil(max(ts) / 16) - bmin_t + 1
            cols = []
            for s, t in zip(ss, ts):
                if lofs < 0 or styles[0] == 255:
                    cols.append((0.25, 0.25, 0.25))
                    continue
                ls = min(smax - 1, max(0, round(s / 16 - bmin_s)))
                lt = min(tmax - 1, max(0, round(t / 16 - bmin_t)))
                p = lofs + (lt * smax + ls) * 3
                if p + 2 >= len(LIGHT):
                    cols.append((0.25, 0.25, 0.25))
                    continue
                cols.append(tuple(min(1.0, (LIGHT[p + j] / 255.0) ** 0.8 * 1.25) for j in range(3)))
            tw, th = max(1, TEX[miptex]["w"]), max(1, TEX[miptex]["h"])
            g = groups.setdefault(miptex, {"P": [], "UV": [], "C": [], "I": []})
            base = len(g["P"])
            for p, s, t, c in zip(pts, ss, ts, cols):
                g["P"].append(p)
                g["UV"].append((s / tw, t / th))
                g["C"].append(c)
            for k in range(1, ne - 1):
                g["I"] += [base, base + k + 1, base + k]
        prims = []
        for miptex, g in groups.items():
            P = g["P"]
            pa = add(struct.pack("<%df" % (3 * len(P)), *[c for v in P for c in v]), 5126, "VEC3", len(P), 34962, [min(v[i] for v in P) for i in range(3)], [max(v[i] for v in P) for i in range(3)])
            ua = add(struct.pack("<%df" % (2 * len(P)), *[c for v in g["UV"] for c in v]), 5126, "VEC2", len(P), 34962)
            ca = add(struct.pack("<%df" % (3 * len(P)), *[c for v in g["C"] for c in v]), 5126, "VEC3", len(P), 34962)
            ia = add(struct.pack("<%dI" % len(g["I"]), *g["I"]), 5125, "SCALAR", len(g["I"]), 34963)
            prims.append({"attributes": {"POSITION": pa, "TEXCOORD_0": ua, "COLOR_0": ca}, "indices": ia, "material": material(miptex)})
        if not prims:
            continue
        meshes.append({"name": "*%d" % mi, "primitives": prims})
        ent = next((e for e in ents if e.get("model") == "*%d" % mi), {"classname": "worldspawn"} if mi == 0 else {})
        nodes.append({"name": ("*%d " % mi) + ent.get("classname", "") + (" " + ent["targetname"] if "targetname" in ent else ""), "mesh": len(meshes) - 1, "extras": {"model": mi, **ent}})
        nodes[0]["children"].append(len(nodes) - 1)

    gl = {
        "asset": {"version": "2.0", "generator": "bsp2glb (HL1)"},
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": nodes, "meshes": meshes,
        "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(bin_)}],
        "materials": materials, "textures": textures, "images": images,
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}],
    }
    js = json.dumps(gl, separators=(",", ":")).encode()
    while len(js) % 4:
        js += b" "
    while len(bin_) % 4:
        bin_.append(0)
    with open(out, "wb") as fo:
        fo.write(struct.pack("<3I", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)))
        fo.write(struct.pack("<2I", len(js), 0x4E4F534A) + js)
        fo.write(struct.pack("<2I", len(bin_), 0x004E4942) + bytes(bin_))
    json.dump({"models": [{"i": i, **{k: list(v) if isinstance(v, tuple) else v for k, v in m.items()}} for i, m in enumerate(M)], "entities": ents}, open(out[:-4] + ".json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(meshes), "malhas ·", len(materials), "materiais ·", len(ents), "entidades ·", os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
