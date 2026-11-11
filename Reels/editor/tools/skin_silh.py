"""Silhueta de um .glb com esqueleto NUMA POSE DA ANIMAÇÃO (skinning na CPU): aplica a animação `anim` no tempo `t`,
calcula as matrizes das juntas, deforma os vértices (JOINTS_0/WEIGHTS_0) e projeta de lado/frente → PNG (alfa).
Uso: python skin_silh.py modelo.glb saida.png anim t yaw_graus [altura_px]"""
import json, struct, sys, math
import numpy as np
from PIL import Image, ImageDraw

path, out, anim_name, t = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
yaw = math.radians(float(sys.argv[5]) if len(sys.argv) > 5 else 0.0)
HPX = int(sys.argv[6]) if len(sys.argv) > 6 else 900
b = open(path, "rb").read()
jl = struct.unpack("<I", b[12:16])[0]
J = json.loads(b[20:20 + jl])
o = 20 + jl
bl = struct.unpack("<I", b[o:o + 4])[0]
BIN = b[o + 8:o + 8 + bl]
CT = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8, 5122: np.int16, 5120: np.int8}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def acc(i):
    a = J["accessors"][i]
    v = J["bufferViews"][a["bufferView"]]
    off = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    dt = np.dtype(CT[a["componentType"]])
    nc = NC[a["type"]]
    stride = v.get("byteStride") or dt.itemsize * nc
    raw = np.frombuffer(BIN, np.uint8, stride * (a["count"] - 1) + dt.itemsize * nc, off)
    arr = np.lib.stride_tricks.as_strided(raw.view(np.uint8), shape=(a["count"], dt.itemsize * nc), strides=(stride, 1)).copy().view(dt).reshape(a["count"], nc)
    if a.get("normalized") and dt.kind in "ui":
        arr = arr.astype(np.float32) / np.iinfo(dt).max
    return arr if nc > 1 else arr[:, 0]


def quat_mat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


nodes = J["nodes"]
TRS = [{"t": np.array(n.get("translation", [0, 0, 0]), float), "r": np.array(n.get("rotation", [0, 0, 0, 1]), float), "s": np.array(n.get("scale", [1, 1, 1]), float), "m": np.array(n["matrix"]).reshape(4, 4).T if "matrix" in n else None} for n in nodes]
# aplica a animação no tempo t (interpolação linear / slerp simples)
A = next((a for a in J.get("animations", []) if a.get("name") == anim_name), None)
if A is None:
    raise SystemExit("animação não achada: " + anim_name + " · " + str([a.get("name") for a in J.get("animations", [])]))
for ch in A["channels"]:
    smp = A["samplers"][ch["sampler"]]
    ti = acc(smp["input"]).astype(float)
    vo = acc(smp["output"]).astype(float)
    node = ch["target"]["node"]
    pth = ch["target"]["path"]
    tt = min(max(t, ti[0]), ti[-1])
    k = int(np.searchsorted(ti, tt, side="right") - 1)
    k = max(0, min(len(ti) - 2, k)) if len(ti) > 1 else 0
    u = 0.0 if len(ti) == 1 else (tt - ti[k]) / max(1e-9, ti[k + 1] - ti[k])
    if len(ti) == 1:
        val = vo[0]
    else:
        a0, a1 = vo[k], vo[k + 1]
        if pth == "rotation":
            if np.dot(a0, a1) < 0:
                a1 = -a1
            val = a0 * (1 - u) + a1 * u
            val /= np.linalg.norm(val)
        else:
            val = a0 * (1 - u) + a1 * u
    key = {"translation": "t", "rotation": "r", "scale": "s"}.get(pth)
    if key:
        TRS[node][key] = val


def local(i):
    d = TRS[i]
    if d["m"] is not None:
        return d["m"]
    M = np.eye(4)
    M[:3, :3] = quat_mat(d["r"]) * d["s"]
    M[:3, 3] = d["t"]
    return M


WORLD = [None] * len(nodes)


def walk(i, P):
    WORLD[i] = P @ local(i)
    for c in nodes[i].get("children", []):
        walk(c, WORLD[i])


for r in J["scenes"][J.get("scene", 0)]["nodes"]:
    walk(r, np.eye(4))
tris = []
for ni, n in enumerate(nodes):
    if "mesh" not in n:
        continue
    for prim in J["meshes"][n["mesh"]]["primitives"]:
        P = acc(prim["attributes"]["POSITION"]).astype(float)
        if "skin" in n and "JOINTS_0" in prim["attributes"]:
            sk = J["skins"][n["skin"]]
            IBM = acc(sk["inverseBindMatrices"]).reshape(-1, 4, 4).transpose(0, 2, 1)
            JM = np.array([WORLD[j] @ IBM[k] for k, j in enumerate(sk["joints"])])
            Jt = acc(prim["attributes"]["JOINTS_0"]).astype(int)
            Wt = acc(prim["attributes"]["WEIGHTS_0"]).astype(float)
            Ph = np.c_[P, np.ones(len(P))]
            V = np.zeros((len(P), 4))
            for c in range(4):
                M = JM[Jt[:, c]]
                V += Wt[:, c:c + 1] * np.einsum("nij,nj->ni", M, Ph)
            V = V[:, :3]
        else:
            V = (np.c_[P, np.ones(len(P))] @ WORLD[ni].T)[:, :3]
        I = acc(prim["indices"]).astype(int).reshape(-1, 3) if "indices" in prim else np.arange(len(V)).reshape(-1, 3)
        tris.append(V[I])
T = np.concatenate(tris)
# eixo vertical: o maior entre Y e Z
up = 1 if (T[..., 1].max() - T[..., 1].min()) > (T[..., 2].max() - T[..., 2].min()) else 2
side = [0, 2 if up == 1 else 1]
c, s = math.cos(yaw), math.sin(yaw)
X = T[..., side[0]] * c + T[..., side[1]] * s
Y = T[..., up]
x0, x1, y0, y1 = X.min(), X.max(), Y.min(), Y.max()
sc = HPX / (y1 - y0)
W = int((x1 - x0) * sc) + 8
im = Image.new("L", (W, HPX + 8), 0)
d = ImageDraw.Draw(im)
for k in range(len(T)):
    d.polygon([((X[k, q] - x0) * sc + 4, (y1 - Y[k, q]) * sc + 4) for q in range(3)], fill=255)
rgba = Image.new("RGBA", im.size, (10, 10, 12, 0))
rgba.putalpha(im)
rgba.save(out)
print("tris", len(T), "png", rgba.size, "up", up)
