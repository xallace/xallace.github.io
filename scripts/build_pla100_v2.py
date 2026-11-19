"""
PLA-100 v2 — Modular Precision Linear Axis (Parametric FreeCAD 1.1 B-Rep Builder)
=================================================================================
Generates a collision-free, standards-compliant (DIN EN ISO 1101 / ISO 286 /
DIN 69051 / HIWIN MGN12H / NEMA-23) 3D CAD assembly:
  - Individual binary STL meshes for Three.js WebGL inspection
  - Named, color-coded STEP AP214 assembly (PLA-100-00-00_Gesamtbaugruppe.step)
  - Computed B-Rep mass/volume/clearance manifest (pla100_manifest.json)
  - Automated OpenCASCADE B-Rep interference & clearance verification across stroke

Run with FreeCAD 1.1 Python:
  & "C:\\Program Files\\FreeCAD 1.1\\bin\\python.exe" scripts/build_pla100_v2.py
"""

import json
import math
import os
import sys
import time

import FreeCAD
import Import
import Mesh
import MeshPart
import Part

V = FreeCAD.Vector

# =============================================================================
# 1. MASTER PARAMETRIC DIMENSIONS (mm)
# =============================================================================
L_BASE = 240.0
W_BASE_U = 84.0       # Main U-channel outer width: Y = [-42, +42]
W_BASE_FLANGE = 108.0 # Outboard mounting ears: Y = [-54, +54]
H_FLANGE = 10.0       # Outboard mounting flange thickness: Z = [0, 10]
W_CHANNEL = 44.0      # Inner channel width: Y = [-22, +22]
Z_FLOOR = 12.0        # Base floor thickness: Z = [0, 12]
Z_RAIL_SEAT = 34.0    # Rail mounting shelf: Z = 34.0
Z_DATUM_B_TOP = 36.0  # Ground reference shoulder on +Y rail: Y = [22, 25]

Z_SPINDLE = 30.0      # Spindle axis Z (keeps NEMA-23 bottom at +1.8 mm > Datum A!)
Y_RAIL = 31.0         # Rail centerline Y = ±31.0 (62 mm track)
W_RAIL = 12.0         # HIWIN MGN12 rail width
H_RAIL = 8.0          # HIWIN MGN12 rail height: Z = [34, 42]

# MGN12H carriages (real HIWIN spec: W=27, L=45.4, assembly height=13 -> Z=[37, 47])
W_BLOCK = 27.0
L_BLOCK = 45.4
X_BLOCK_C = 24.0      # Two blocks per rail at X_local = ±24.0 (2.6 mm gap)
Z_BLOCK_BOT = 37.0
Z_BLOCK_TOP = 47.0

# Carriage table (EN AW-7075 T6)
L_TABLE = 100.0       # X_local = [-50, +50]
W_TABLE = 96.0        # Y = [-48, +48] -> 3.9 mm solid wall outside Y=±41 M3 c'bores
H_TABLE = 12.0        # Z = [47, 59]

# Stroke limits (carriage table X_local = ±50.0, bumpers 6 mm thick at X=0..6 and 234..240)
BUMPER_T = 6.0
STROKE_MIN = 56.0     # Front hard stop (table front at X=6.0, blocks at X=9.3 inside rail!)
STROKE_USE_MIN = 70.0 # Usable stroke start (14 mm safety margin)
STROKE_CENTER = 120.0
STROKE_USE_MAX = 170.0# Usable stroke end (100.0 mm usable stroke)
STROKE_MAX = 184.0    # Rear hard stop (table rear at X=234.0, blocks at X=230.7 inside rail!)

# Housings & Motor Stackup
T_FIXED = 24.0        # Fixed bearing housing: X = [-24, 0]
L_LANTERN = 40.0      # Open-sided motor lantern: X = [-64, -24]
L_MOTOR = 56.0        # NEMA-23 motor body: X = [-120, -64]
T_FLOAT = 18.0        # Floating bearing housing: X = [240, 258]
H_HOUSING = 60.0      # Z = [0, 60]

# Ball Screw SFU1204 (Ø12 x 4 mm)
D_SPINDLE = 12.0
PITCH = 4.0
R_SPINDLE_ROOT = 4.85
R_SPINDLE_MAJ = 6.0

# Material densities (g/cm^3 -> kg/mm^3 = density * 1e-6)
DENSITY = {
    "EN AW-6082 T6": 2.70e-6,
    "EN AW-7075 T6 anodized": 2.81e-6,
    "100Cr6 hardened": 7.81e-6,
    "CF53 / 100Cr6": 7.83e-6,
    "16MnCr5 case-hardened": 7.85e-6,
    "100Cr6 / POM": 7.10e-6,
    "Steel 8.8 / A2-70": 7.85e-6,
    "DC01 galvanized": 7.85e-6,
    "PUR 98 Sh-A": 1.21e-6,
    "NBR 70 Sh-A": 1.25e-6,
    "Brass Ni-plated / PBT": 6.20e-6,
    "Die-cast Al / Cu / Fe": 4.95e-6,
}

# =============================================================================
# 2. GEOMETRY HELPERS
# =============================================================================
def box(x0, x1, y0, y1, z0, z1):
    return Part.makeBox(x1 - x0, y1 - y0, z1 - z0, V(x0, y0, z0))

def cyl_x(r, x0, x1, y=0.0, z=Z_SPINDLE):
    return Part.makeCylinder(r, x1 - x0, V(x0, y, z), V(1, 0, 0))

def cyl_y(r, y0, y1, x=0.0, z=0.0):
    return Part.makeCylinder(r, y1 - y0, V(x, y0, z), V(0, 1, 0))

def cyl_z(r, z0, z1, x=0.0, y=0.0):
    return Part.makeCylinder(r, z1 - z0, V(x, y, z0), V(0, 0, 1))

def fuse_all(shapes):
    if len(shapes) == 1:
        return shapes[0]
    res = shapes[0].multiFuse(shapes[1:])
    return res

def cut_all(base_shape, tools):
    if not tools:
        return base_shape
    if len(tools) == 1:
        return base_shape.cut(tools[0])
    return base_shape.cut(Part.makeCompound(tools))

def make_shcs_z(x, y, z_head_bot, d_nom, l_shank, d_head, h_head, z_dir=-1):
    """DIN 912 Socket Head Cap Screw along Z. z_dir=-1 means head sits above z_head_bot and shank goes down."""
    if z_dir < 0:
        head = cyl_z(d_head / 2.0, z_head_bot, z_head_bot + h_head, x, y)
        shank = cyl_z(d_nom / 2.0, z_head_bot - l_shank, z_head_bot, x, y)
        # Hex socket recess
        hex_r = d_nom * 0.45
        hex_pts = [V(x + hex_r * math.cos(i * math.pi / 3), y + hex_r * math.sin(i * math.pi / 3), z_head_bot + h_head - h_head * 0.55) for i in range(6)]
        hex_pts.append(hex_pts[0])
        sock = Part.Face(Part.makePolygon(hex_pts)).extrude(V(0, 0, h_head * 0.6))
        return head.fuse(shank).cut(sock)
    else:
        head = cyl_z(d_head / 2.0, z_head_bot - h_head, z_head_bot, x, y)
        shank = cyl_z(d_nom / 2.0, z_head_bot, z_head_bot + l_shank, x, y)
        return head.fuse(shank)

def make_shcs_x(x_head_seat, y, z, d_nom, l_shank, d_head, h_head, x_dir=+1):
    """DIN 912 Socket Head Cap Screw along X. x_dir=+1 means shank extends in +X, head sits on -X side of x_head_seat."""
    if x_dir > 0:
        head = cyl_x(d_head / 2.0, x_head_seat - h_head, x_head_seat, y, z)
        shank = cyl_x(d_nom / 2.0, x_head_seat, x_head_seat + l_shank, y, z)
        hex_r = d_nom * 0.45
        hex_pts = [V(x_head_seat - h_head - 0.1, y + hex_r * math.cos(i * math.pi / 3), z + hex_r * math.sin(i * math.pi / 3)) for i in range(6)]
        hex_pts.append(hex_pts[0])
        sock = Part.Face(Part.makePolygon(hex_pts)).extrude(V(h_head * 0.6, 0, 0))
        return head.fuse(shank).cut(sock)
    else:
        head = cyl_x(d_head / 2.0, x_head_seat, x_head_seat + h_head, y, z)
        shank = cyl_x(d_nom / 2.0, x_head_seat - l_shank, x_head_seat, y, z)
        hex_r = d_nom * 0.45
        hex_pts = [V(x_head_seat + h_head + 0.1, y + hex_r * math.cos(i * math.pi / 3), z + hex_r * math.sin(i * math.pi / 3)) for i in range(6)]
        hex_pts.append(hex_pts[0])
        sock = Part.Face(Part.makePolygon(hex_pts)).extrude(V(-h_head * 0.6, 0, 0))
        return head.fuse(shank).cut(sock)

def make_shcs_y(x, y_head_seat, z, d_nom, l_shank, d_head, h_head, y_dir=-1):
    """DIN 912 SHCS along Y. y_dir=-1 means shank extends in -Y, head sits on +Y side."""
    if y_dir < 0:
        head = cyl_y(d_head / 2.0, y_head_seat, y_head_seat + h_head, x, z)
        shank = cyl_y(d_nom / 2.0, y_head_seat - l_shank, y_head_seat, x, z)
        return head.fuse(shank)
    else:
        head = cyl_y(d_head / 2.0, y_head_seat - h_head, y_head_seat, x, z)
        shank = cyl_y(d_nom / 2.0, y_head_seat, y_head_seat + l_shank, x, z)
        return head.fuse(shank)


# =============================================================================
# 3. PART BUILDERS
# =============================================================================
def build_base():
    # Main U-channel body: X=[0,240], Y=[-42,42], Z=[0,34]
    u_body = box(0, L_BASE, -W_BASE_U / 2, W_BASE_U / 2, 0, Z_RAIL_SEAT)
    # Outboard mounting flanges: Y=[-54,54], Z=[0,10]
    flange = box(0, L_BASE, -W_BASE_FLANGE / 2, W_BASE_FLANGE / 2, 0, H_FLANGE)
    # Datum B reference shoulder on +Y rail inner edge: Y=[22, 25], Z=[34, 36]
    datum_b = box(0, L_BASE, 22.0, 25.0, Z_RAIL_SEAT, Z_DATUM_B_TOP)
    shape = fuse_all([u_body, flange, datum_b])

    cuts = []
    # Inner channel milled out: Y=[-22, +22], Z=[12, 37]
    cuts.append(box(-1, L_BASE + 1, -W_CHANNEL / 2, W_CHANNEL / 2, Z_FLOOR, Z_DATUM_B_TOP + 2))

    # 6x M6 outboard base mounting counterbored holes (X=25, 120, 215; Y=±48)
    for x in (25.0, 120.0, 215.0):
        for y in (-48.0, 48.0):
            cuts.append(cyl_z(3.3, -1, H_FLANGE + 1, x, y))       # Ø6.6 through
            cuts.append(cyl_z(5.5, 4.0, H_FLANGE + 1, x, y))      # Ø11.0 x 6 mm c'bore

    # 18x M3 tapped rail holes (Y=±31, X=20..220 pitch 25, Z=25..34)
    for x in range(20, 221, 25):
        for y in (-Y_RAIL, Y_RAIL):
            cuts.append(cyl_z(1.6, Z_RAIL_SEAT - 9.0, Z_RAIL_SEAT + 1.0, float(x), y))

    # End-face M5 tapped holes + Ø4 H7 dowel holes on X=0 and X=240 (4 bolts + 2 dowels per end)
    end_bolts = [(-32.0, 16.0), (32.0, 16.0), (-14.0, 6.0), (14.0, 6.0)]
    end_dowels = [(-32.0, 6.0), (32.0, 6.0)]
    for y, z in end_bolts:
        cuts.append(cyl_x(2.6, -1.0, 15.0, y, z))
        cuts.append(cyl_x(2.6, L_BASE - 15.0, L_BASE + 1.0, y, z))
    for y, z in end_dowels:
        cuts.append(cyl_x(2.05, -1.0, 8.0, y, z))
        cuts.append(cyl_x(2.05, L_BASE - 8.0, L_BASE + 1.0, y, z))

    # 4x M4 side mounting holes for the 2 limit switch brackets on +Y face (Y=42, Z=21)
    for x in (65.0, 75.0, 165.0, 175.0):
        cuts.append(cyl_y(2.1, 32.0, 43.0, x, 21.0))

    shape = cut_all(shape, cuts)
    return shape


def build_rail(y_center):
    # HIWIN MGN12 rail: W=12, H=8, L=240, Z=[34, 42]
    rail = box(0, L_BASE, y_center - 6.0, y_center + 6.0, Z_RAIL_SEAT, Z_RAIL_SEAT + H_RAIL)
    cuts = []
    # Longitudinal gothic-arch raceway grooves along both sides of rail (Z=37.2..39.8, 1.1 mm deep)
    for sy in (-1.0, 1.0):
        gy = y_center + sy * 6.0
        cuts.append(cyl_x(1.25, -1.0, L_BASE + 1.0, gy, 38.5))
    # 9x M3 counterbored mounting holes (X=20..220, pitch 25)
    for x in range(20, 221, 25):
        cuts.append(cyl_z(1.75, Z_RAIL_SEAT - 0.5, Z_RAIL_SEAT + H_RAIL + 0.5, float(x), y_center))
        cuts.append(cyl_z(3.1, Z_RAIL_SEAT + 3.5, Z_RAIL_SEAT + H_RAIL + 0.5, float(x), y_center))
    return cut_all(rail, cuts)


def build_blocks():
    """4x HIWIN MGN12H carriages centered at X_local=±24, Y=±31, Z=[37, 47] with real C-slot & wipers."""
    solids = []
    for xc in (-X_BLOCK_C, X_BLOCK_C):
        for yc in (-Y_RAIL, Y_RAIL):
            # Main steel body (39.4 mm) + end wiper seals (3.0 mm each -> 45.4 mm total)
            b = box(xc - L_BLOCK / 2, xc + L_BLOCK / 2, yc - W_BLOCK / 2, yc + W_BLOCK / 2, Z_BLOCK_BOT, Z_BLOCK_TOP)
            cuts = []
            # Underside C-channel clearing rail (W=12.4, Z=[36.5, 42.3]) -> 0.2 mm clearance around rail!
            cuts.append(box(xc - L_BLOCK / 2 - 1, xc + L_BLOCK / 2 + 1, yc - 6.3, yc + 6.3, Z_BLOCK_BOT - 0.5, Z_RAIL_SEAT + H_RAIL + 0.35))
            # Side chamfer / wiper step grooves at X = xc ± 19.7
            for sx in (-1.0, 1.0):
                wx = xc + sx * 19.7
                cuts.append(box(wx - 0.5, wx + 0.5, yc - W_BLOCK / 2 - 0.5, yc - W_BLOCK / 2 + 0.8, Z_BLOCK_BOT - 0.5, Z_BLOCK_TOP + 0.5))
                cuts.append(box(wx - 0.5, wx + 0.5, yc + W_BLOCK / 2 - 0.8, yc + W_BLOCK / 2 + 0.5, Z_BLOCK_BOT - 0.5, Z_BLOCK_TOP + 0.5))
            # 4x M3 tapped mounting holes (20 x 20 mm pitch: xc±10, yc±10)
            for dx in (-10.0, 10.0):
                for dy in (-10.0, 10.0):
                    cuts.append(cyl_z(1.6, Z_BLOCK_TOP - 5.0, Z_BLOCK_TOP + 0.5, xc + dx, yc + dy))
            solids.append(cut_all(b, cuts))
    return Part.makeCompound(solids)


def build_spindle():
    """Real SFU1204 Ø12x4 ball screw with 58 exact helical Gothic-arch turns + BK10/BF10 end journals."""
    # Core from X=0 to X=240 (R=4.85 mm)
    core = cyl_x(R_SPINDLE_ROOT, 0.0, 240.0, 0.0, Z_SPINDLE)
    # Build one exact 2-turn helical ridge segment (8.0 mm -> zero OpenCASCADE long-helix B-spline drift!)
    seg_turns = 2
    seg_len = PITCH * seg_turns
    helix = Part.makeHelix(PITCH, seg_len, R_SPINDLE_ROOT)
    # 6-point chamfered Gothic-arch land profile (pitch=4.0, outer crest Ø12.000 mm exact)
    pts = [
        V(R_SPINDLE_ROOT - 0.15, 0, -1.25),
        V(5.55, 0, -1.05),
        V(R_SPINDLE_MAJ, 0, -0.75),
        V(R_SPINDLE_MAJ, 0, 0.75),
        V(5.55, 0, 1.05),
        V(R_SPINDLE_ROOT - 0.15, 0, 1.25),
        V(R_SPINDLE_ROOT - 0.15, 0, -1.25),
    ]
    wire = Part.makePolygon(pts)
    seg = Part.Wire([helix]).makePipeShell([wire], True, True)
    seg.rotate(V(0, 0, 0), V(0, 1, 0), 90.0)
    seg.translate(V(0.0, 0.0, Z_SPINDLE))

    # Replicate 29 times across X=[2.0, 234.0] (58 full turns, guaranteed R=6.000 mm everywhere!)
    ridges = []
    for k in range(29):
        s_copy = seg.copy()
        s_copy.translate(V(2.0 + k * seg_len, 0.0, 0.0))
        ridges.append(s_copy)

    # Fixed end journals:
    # Shoulder step Ø12 from X=-3..2 (inside bearing face)
    j_shoulder = cyl_x(6.0, -3.0, 2.5, 0.0, Z_SPINDLE)
    # 2x 7001-B bearing seat Ø12 k5: X=[-19, -3]
    j_fixed = cyl_x(5.95, -19.0, -3.0, 0.0, Z_SPINDLE)
    # M10x1 locknut thread journal: X=[-27, -19]
    j_lock = cyl_x(4.95, -27.0, -19.0, 0.0, Z_SPINDLE)
    # Ø8 coupling shaft: X=[-41, -27] with machined D-flat on top
    j_coup = cyl_x(3.95, -41.0, -27.0, 0.0, Z_SPINDLE)
    flat_cut = box(-42.0, -28.0, -5.0, 5.0, Z_SPINDLE + 3.2, Z_SPINDLE + 5.0)
    j_coup = j_coup.cut(flat_cut)

    # Floating end journal: Ø12 g6 from X=236..256 with DIN 471 circlip groove at X=252.0..253.2
    j_float = cyl_x(5.95, 236.0, 256.0, 0.0, Z_SPINDLE)
    circlip_groove = cyl_x(6.2, 252.0, 253.2, 0.0, Z_SPINDLE).cut(cyl_x(5.3, 251.9, 253.3, 0.0, Z_SPINDLE))
    j_float = j_float.cut(circlip_groove)

    shaft = fuse_all([core, j_shoulder, j_fixed, j_lock, j_coup, j_float])
    # Compound shaft + exact helical ridges (clean tessellation & fast exact STEP!)
    return Part.makeCompound([shaft, *ridges])


def build_nut():
    """SFU1204 DIN 69051 Form B flanged ball nut: body X=[-18, +8] Ø22, double-flat flange X=[+8, +18] Ø40 trimmed Z=[15,45]."""
    body = cyl_x(11.0, -18.0, 8.0, 0.0, Z_SPINDLE)
    flange_cyl = cyl_x(20.0, 8.0, 18.0, 0.0, Z_SPINDLE)
    # Trim top and bottom of flange to Z=[15, 45] (30 mm across flats -> 3 mm above base floor!)
    trim_box = box(7.5, 18.5, -21.0, 21.0, Z_SPINDLE - 15.0, Z_SPINDLE + 15.0)
    flange = flange_cyl.common(trim_box)
    # Grease nipple boss on top of flange (Z=45..46.8, X=13) — clears table bottom Z=47 by 0.2 mm
    grease = cyl_z(2.2, 44.5, 46.6, 13.0, 0.0)
    nut = fuse_all([body, flange, grease])

    cuts = []
    # Central bore Ø12.6 mm (real SFU1204 radial ball clearance above Ø12.0 screw crests!)
    cuts.append(cyl_x(6.3, -19.0, 19.0, 0.0, Z_SPINDLE))
    # 4x Ø4.5 clearance bolt holes on PCD Ø32 at ±30° from horizontal (Y=±13.86, Z=30±8)
    for sy in (-1.0, 1.0):
        for sz in (-1.0, 1.0):
            hy = sy * 16.0 * math.cos(math.radians(30.0))
            hz = Z_SPINDLE + sz * 16.0 * math.sin(math.radians(30.0))
            cuts.append(cyl_x(2.25, 7.5, 18.5, hy, hz))
    return cut_all(nut, cuts)


def build_nut_saddle():
    """Machined saddle connecting SFU1204 flange (at X=+8) to Carriage Table bottom (Z=47)."""
    # Lower flange-mating block: X=[-14, +8], Y=[-20, +20], Z=[15.2, 37.0]
    lower = box(-14.0, 8.0, -20.0, 20.0, 15.2, Z_BLOCK_BOT)
    # Upper neck clearing MGN12H blocks (Y=±17.5 -> neck Y=[-16, +16]): X=[-14, +8], Z=[37.0, 47.0]
    upper = box(-14.0, 8.0, -16.0, 16.0, Z_BLOCK_BOT, Z_BLOCK_TOP)
    saddle = fuse_all([lower, upper])

    cuts = []
    # Central bore Ø22.4 mm clearing SFU1204 nut body (Ø22.0) cleanly!
    cuts.append(cyl_x(11.2, -15.0, 9.0, 0.0, Z_SPINDLE))
    # 4x M4 tapped axial holes on X=+8 mating nut flange bolts (PCD Ø32, ±30°)
    for sy in (-1.0, 1.0):
        for sz in (-1.0, 1.0):
            hy = sy * 16.0 * math.cos(math.radians(30.0))
            hz = Z_SPINDLE + sz * 16.0 * math.sin(math.radians(30.0))
            cuts.append(cyl_x(2.1, -4.0, 9.0, hy, hz))
    # 4x M4 tapped vertical holes on Z=47 mating table bolts (X=-10, +4; Y=±11)
    for hx in (-10.0, 4.0):
        for hy in (-11.0, 11.0):
            cuts.append(cyl_z(2.1, Z_BLOCK_TOP - 9.0, Z_BLOCK_TOP + 0.5, hx, hy))
    return cut_all(saddle, cuts)


def build_table():
    """Carriage Table: 100 x 96 x 12 mm (Z=[47, 59]), EN AW-7075 T6 blue anodized."""
    tbl = box(-L_TABLE / 2, L_TABLE / 2, -W_TABLE / 2, W_TABLE / 2, Z_BLOCK_TOP, Z_BLOCK_TOP + H_TABLE)
    cuts = []

    # 16x M3 counterbored mounting holes to 4x MGN12H blocks (X=±34, ±14; Y=±21, ±41)
    # Outer holes at Y=±41 with Ø6.2 c'bore -> outer wall = 48 - 44.1 = 3.9 mm solid metal!
    for xc in (-X_BLOCK_C, X_BLOCK_C):
        for dx in (-10.0, 10.0):
            for yc in (-Y_RAIL, Y_RAIL):
                for dy in (-10.0, 10.0):
                    hx, hy = xc + dx, yc + dy
                    cuts.append(cyl_z(1.75, Z_BLOCK_TOP - 0.5, Z_BLOCK_TOP + H_TABLE + 0.5, hx, hy))
                    cuts.append(cyl_z(3.1, Z_BLOCK_TOP + 7.5, Z_BLOCK_TOP + H_TABLE + 0.5, hx, hy))

    # 4x M4 counterbored mounting holes to Nut Saddle (X=-10, +4; Y=±11)
    for hx in (-10.0, 4.0):
        for hy in (-11.0, 11.0):
            cuts.append(cyl_z(2.25, Z_BLOCK_TOP - 0.5, Z_BLOCK_TOP + H_TABLE + 0.5, hx, hy))
            cuts.append(cyl_z(4.1, Z_BLOCK_TOP + 6.5, Z_BLOCK_TOP + H_TABLE + 0.5, hx, hy))

    # True 25 x 25 mm 3x3 M5 tapped payload mounting grid (Ø4.2 x 8 mm deep from Z=59)
    for hx in (-25.0, 0.0, 25.0):
        for hy in (-25.0, 0.0, 25.0):
            cuts.append(cyl_z(2.1, Z_BLOCK_TOP + H_TABLE - 8.0, Z_BLOCK_TOP + H_TABLE + 0.5, hx, hy))

    # 2x Ø5 H7 fixture locating dowel pin holes (X=±37.5, Y=0)
    for hx in (-37.5, 37.5):
        cuts.append(cyl_z(2.5, Z_BLOCK_TOP + H_TABLE - 7.0, Z_BLOCK_TOP + H_TABLE + 0.5, hx, 0.0))

    # 2x M3 side tapped holes on +Y face (Y=48) for bolted trigger flag (X=±6, Z=53)
    for hx in (-6.0, 6.0):
        cuts.append(cyl_y(1.6, W_TABLE / 2 - 7.0, W_TABLE / 2 + 0.5, hx, 53.0))

    return cut_all(tbl, cuts)


def build_fixed_bearing_housing():
    """BK10-style Fixed Bearing Housing: X=[-24, 0], Y=[-42, +42], Z=[0, 60]."""
    hb = box(-T_FIXED, 0.0, -W_BASE_U / 2, W_BASE_U / 2, 0.0, H_HOUSING)
    cuts = []
    # Main Ø28 H7 bore for 2x 7001-B bearings (X=[-24.5, -3.0]) -> shoulder stops bearings at X=-3.0!
    cuts.append(cyl_x(14.05, -T_FIXED - 0.5, -3.0, 0.0, Z_SPINDLE))
    # Inner shaft clearance bore Ø18 through X=[-3.5, +0.5]
    cuts.append(cyl_x(9.0, -3.5, 0.5, 0.0, Z_SPINDLE))

    # 4x M5 counterbored base mounting holes (bolt heads recessed on X=-24 face)
    for y, z in [(-32.0, 16.0), (32.0, 16.0), (-14.0, 6.0), (14.0, 6.0)]:
        cuts.append(cyl_x(2.75, -T_FIXED - 0.5, 0.5, y, z))
        cuts.append(cyl_x(5.0, -T_FIXED - 0.5, -T_FIXED + 6.5, y, z))

    # 2x Ø4 H7 locating dowel pin holes on X=0 face
    for y, z in [(-32.0, 6.0), (32.0, 6.0)]:
        cuts.append(cyl_x(2.05, -7.0, 0.5, y, z))

    # 4x M4 tapped holes for bearing retainer cap on X=-24 (PCD Ø36 at 45°)
    for ang in (45, 135, 225, 315):
        hy = 18.0 * math.cos(math.radians(ang))
        hz = Z_SPINDLE + 18.0 * math.sin(math.radians(ang))
        cuts.append(cyl_x(2.1, -T_FIXED - 0.5, -14.0, hy, hz))

    # 4x M5 tapped holes for Motor Lantern on X=-24 (Y=±26, Z=8 & 52)
    for y in (-26.0, 26.0):
        for z in (8.0, 52.0):
            cuts.append(cyl_x(2.6, -T_FIXED - 0.5, -12.0, y, z))

    # 2x M4 tapped bumper holes on X=0 face (Y=±32, Z=53)
    for y in (-32.0, 32.0):
        cuts.append(cyl_x(2.1, -8.0, 0.5, y, 53.0))

    return cut_all(hb, cuts)


def build_bearing_unit(x0, width, d_id=12.0, d_od=28.0, n_balls=10):
    """Realistic rolling bearing with outer race, inner race, and steel ball complement."""
    r_in = d_id / 2.0 + 0.05   # clears spindle cleanly
    r_out = d_od / 2.0 - 0.05  # clears H7 bore cleanly
    r_pitch = (r_in + r_out) / 2.0
    r_ball = (r_out - r_in) * 0.28
    # Outer ring
    outer = cyl_x(r_out, x0, x0 + width, 0.0, Z_SPINDLE).cut(cyl_x(r_pitch + r_ball * 0.65, x0 - 0.2, x0 + width + 0.2, 0.0, Z_SPINDLE))
    # Inner ring
    inner = cyl_x(r_pitch - r_ball * 0.65, x0, x0 + width, 0.0, Z_SPINDLE).cut(cyl_x(r_in, x0 - 0.2, x0 + width + 0.2, 0.0, Z_SPINDLE))
    parts = [outer, inner]
    # Ball complement (visible in Section A-A!)
    xc = x0 + width / 2.0
    for i in range(n_balls):
        ang = (2.0 * math.pi * i) / n_balls
        by = r_pitch * math.cos(ang)
        bz = Z_SPINDLE + r_pitch * math.sin(ang)
        parts.append(Part.makeSphere(r_ball, V(xc, by, bz)))
    return Part.makeCompound(parts)


def build_fixed_bearings_kit():
    """2x 7001-B angular contact bearings (X=[-19,-3]) + 4-bolt retainer cap + KM0 M10x1 locknut."""
    b1 = build_bearing_unit(-11.0, 7.9, 12.0, 28.0, n_balls=12)
    b2 = build_bearing_unit(-18.95, 7.9, 12.0, 28.0, n_balls=12)

    # Bearing retainer flange cap: spigot X=[-23.8, -19.05] Ø27.9 + outer flange X=[-27.5, -24.05] Ø44?
    # Wait: keep retainer flush INSIDE fixed housing bore X=[-23.9, -19.05] with 4-bolt flange X=[-26.5, -24.05] Ø44?
    # Check KM0 locknut at X=[-26.5, -20.5]: make cap outer bore Ø20 so KM0 locknut (Ø18) fits cleanly inside!
    cap_spigot = cyl_x(13.92, -24.0, -19.05, 0.0, Z_SPINDLE)
    cap_flange = cyl_x(21.8, -26.8, -24.05, 0.0, Z_SPINDLE)
    cap = fuse_all([cap_spigot, cap_flange])
    cap_cuts = [cyl_x(10.0, -27.5, -18.5, 0.0, Z_SPINDLE)]  # Ø20 center bore clears KM0 locknut Ø18!
    for ang in (45, 135, 225, 315):
        hy = 18.0 * math.cos(math.radians(ang))
        hz = Z_SPINDLE + 18.0 * math.sin(math.radians(ang))
        cap_cuts.append(cyl_x(2.25, -27.5, -23.5, hy, hz))
    cap = cut_all(cap, cap_cuts)

    # KM0 M10x1 slotted locknut: X=[-25.8, -19.2], OD=18.0, ID=10.05, 4 radial spanner notches
    locknut = cyl_x(9.0, -25.8, -19.2, 0.0, Z_SPINDLE).cut(cyl_x(5.05, -26.5, -18.5, 0.0, Z_SPINDLE))
    slots = []
    for ang in (0, 90, 180, 270):
        rad = math.radians(ang)
        if ang in (0, 180):
            sy = 8.5 * math.cos(rad)
            slots.append(box(-26.2, -18.8, sy - 1.5, sy + 1.5, Z_SPINDLE - 1.5, Z_SPINDLE + 1.5))
        else:
            sz = Z_SPINDLE + 8.5 * math.sin(rad)
            slots.append(box(-26.2, -18.8, -1.5, 1.5, sz - 1.5, sz + 1.5))
    locknut = cut_all(locknut, slots)

    return Part.makeCompound([b1, b2, cap, locknut])


def build_floating_bearing_housing():
    """BF10-style Floating Bearing Housing: X=[240, 258], Y=[-42, +42], Z=[0, 60]."""
    hb = box(L_BASE, L_BASE + T_FLOAT, -W_BASE_U / 2, W_BASE_U / 2, 0.0, H_HOUSING)
    cuts = []
    # Ø28 H7 bore X=[243.5, 252.5] (9.0 mm wide -> +0.5 mm axial float clearance on both sides of 8.0 mm 6001 bearing!)
    cuts.append(cyl_x(14.05, 243.5, 252.5, 0.0, Z_SPINDLE))
    # Inner clearance bore Ø18 X=[239.5, 244.0]
    cuts.append(cyl_x(9.0, 239.5, 244.0, 0.0, Z_SPINDLE))
    # Outer inspection/circlip access bore Ø22 X=[252.0, 258.5]
    cuts.append(cyl_x(11.0, 252.0, 258.5, 0.0, Z_SPINDLE))

    # 4x M5 counterbored base mounting holes (heads recessed on X=258 face)
    for y, z in [(-32.0, 16.0), (32.0, 16.0), (-14.0, 6.0), (14.0, 6.0)]:
        cuts.append(cyl_x(2.75, L_BASE - 0.5, L_BASE + T_FLOAT + 0.5, y, z))
        cuts.append(cyl_x(5.0, L_BASE + T_FLOAT - 6.5, L_BASE + T_FLOAT + 0.5, y, z))

    # 2x Ø4 H7 dowel pin holes on X=240 face
    for y, z in [(-32.0, 6.0), (32.0, 6.0)]:
        cuts.append(cyl_x(2.05, L_BASE - 0.5, L_BASE + 7.0, y, z))

    # 2x M4 tapped bumper holes on X=240 face (Y=±32, Z=53)
    for y in (-32.0, 32.0):
        cuts.append(cyl_x(2.1, L_BASE - 0.5, L_BASE + 8.0, y, 53.0))

    return cut_all(hb, cuts)


def build_floating_bearing_kit():
    """6001 Deep Groove Bearing (X=[244, 252]) + DIN 471 Ø12 circlip (X=[252.1, 253.1])."""
    b = build_bearing_unit(244.05, 7.9, 12.0, 28.0, n_balls=10)
    # DIN 471 retaining ring (C-ring with lug gap at top)
    ring = cyl_x(8.2, 252.1, 253.1, 0.0, Z_SPINDLE).cut(cyl_x(5.55, 251.9, 253.3, 0.0, Z_SPINDLE))
    gap = box(251.8, 253.4, -1.8, 1.8, Z_SPINDLE + 4.0, Z_SPINDLE + 10.0)
    ring = ring.cut(gap)
    return Part.makeCompound([b, ring])


def build_motor_lantern():
    """Open-sided CNC Motor Lantern: X=[-64, -24], Y=[-32, +32], Z=[0, 60]."""
    body = box(-T_FIXED - L_LANTERN, -T_FIXED, -32.0, 32.0, 0.0, H_HOUSING)
    cuts = []
    # Main internal cavity clearing jaw coupling Ø25 & retainer cap Ø44: X=[-57, -27], Y=[-33, +33], Z=[10, 50]
    cuts.append(box(-57.0, -27.0, -33.0, 33.0, 10.0, 50.0))
    # Rear clearance bore Ø45 X=[-27.5, -23.5] clearing bearing retainer flange (Ø44) cleanly!
    cuts.append(cyl_x(22.5, -27.5, -23.5, 0.0, Z_SPINDLE))
    # Front NEMA-23 spigot pilot bore Ø38.2 H7 X=[-64.5, -56.5]
    cuts.append(cyl_x(19.1, -64.5, -56.5, 0.0, Z_SPINDLE))

    # 4x M5 through holes bolting lantern to Fixed Bearing Housing (Y=±26, Z=8 & 52)
    for y in (-26.0, 26.0):
        for z in (8.0, 52.0):
            cuts.append(cyl_x(2.75, -36.0, -23.5, y, z))
            # Access notch/counterbore inside lantern corner
            cuts.append(cyl_x(5.0, -36.0, -30.0, y, z))

    # 4x M5 tapped NEMA-23 mounting holes on X=-64 (47.14 x 47.14 mm -> Y=±23.57, Z=30±23.57)
    for sy in (-1.0, 1.0):
        for sz in (-1.0, 1.0):
            cuts.append(cyl_x(2.6, -64.5, -55.0, sy * 23.57, Z_SPINDLE + sz * 23.57))

    return cut_all(body, cuts)


def build_coupling():
    """D25 L30 Jaw Coupling (X=[-59, -29]): returns (hubs_shape, spider_shape)."""
    # Motor-side hub: X=[-59, -46.5] + 3 interlocking jaws X=[-46.5, -41.5]
    hub_m = cyl_x(12.5, -59.0, -46.5, 0.0, Z_SPINDLE)
    # Spindle-side hub: X=[-41.5, -29.0] + 3 interlocking jaws X=[-46.5, -41.5]
    hub_s = cyl_x(12.5, -41.5, -29.0, 0.0, Z_SPINDLE)

    # Cut shaft bores + clamping slits
    hub_m = hub_m.cut(cyl_x(3.25, -59.5, -46.0, 0.0, Z_SPINDLE))  # Ø6.35 motor shaft + clearance
    hub_s = hub_s.cut(cyl_x(4.05, -42.0, -28.5, 0.0, Z_SPINDLE))  # Ø8.0 spindle shaft + clearance
    # Clamping radial slits on both hubs
    hub_m = hub_m.cut(box(-59.5, -49.0, -0.8, 0.8, Z_SPINDLE + 3.0, Z_SPINDLE + 13.0))
    hub_s = hub_s.cut(box(-39.0, -28.5, -0.8, 0.8, Z_SPINDLE - 13.0, Z_SPINDLE - 3.0))

    # Add 3 axial jaw teeth on each hub (alternating 60° sectors, leaving 6-lobe space for PUR spider!)
    jaw_m_list = [hub_m]
    jaw_s_list = [hub_s]
    for i in range(3):
        ang_m = math.radians(i * 120.0)
        jm = cyl_x(2.8, -46.6, -42.0, 8.8 * math.cos(ang_m), Z_SPINDLE + 8.8 * math.sin(ang_m))
        jaw_m_list.append(jm)
        ang_s = math.radians(i * 120.0 + 60.0)
        js = cyl_x(2.8, -46.0, -41.4, 8.8 * math.cos(ang_s), Z_SPINDLE + 8.8 * math.sin(ang_s))
        jaw_s_list.append(js)
    hubs = Part.makeCompound([fuse_all(jaw_m_list), fuse_all(jaw_s_list)])

    # Vivid red PUR 98 Sh-A elastomer spider star: X=[-46.2, -41.8], 6 lobes between the hub jaws!
    sp_ring = cyl_x(6.2, -46.2, -41.8, 0.0, Z_SPINDLE).cut(cyl_x(4.2, -46.5, -41.5, 0.0, Z_SPINDLE))
    lobes = [sp_ring]
    for i in range(6):
        ang = math.radians(i * 60.0 + 30.0)
        lobe = cyl_x(2.15, -46.2, -41.8, 9.2 * math.cos(ang), Z_SPINDLE + 9.2 * math.sin(ang))
        lobes.append(lobe)
    spider = fuse_all(lobes)
    return hubs, spider


def build_motor():
    """NEMA-23 Stepper Motor (56.4x56.4x56 mm): X=[-120, -64], Z=[+1.8, +58.2] (+1.8 mm above Datum A!)."""
    half = 28.2
    # Main octagonal/chamfered body profile extruded along X
    ch = 5.0
    pts = [
        V(-120.0, -half + ch, Z_SPINDLE - half),
        V(-120.0,  half - ch, Z_SPINDLE - half),
        V(-120.0,  half,      Z_SPINDLE - half + ch),
        V(-120.0,  half,      Z_SPINDLE + half - ch),
        V(-120.0,  half - ch, Z_SPINDLE + half),
        V(-120.0, -half + ch, Z_SPINDLE + half),
        V(-120.0, -half,      Z_SPINDLE + half - ch),
        V(-120.0, -half,      Z_SPINDLE - half + ch),
        V(-120.0, -half + ch, Z_SPINDLE - half),
    ]
    wire = Part.makePolygon(pts)
    body = Part.Face(wire).extrude(V(L_MOTOR, 0, 0))

    # Front mounting flange ears (square corners with 4x Ø5.2 holes) at X=[-69, -64]
    flange = box(-69.0, -64.0, -half, half, Z_SPINDLE - half, Z_SPINDLE + half)
    # Pilot boss Ø38.0 x 1.6 mm protruding into lantern (X=[-64, -62.4])
    boss = cyl_x(18.95, -64.0, -62.4, 0.0, Z_SPINDLE)
    # Output shaft Ø6.35 mm (X=[-64, -47.0]) with D-flat, clears spider cleanly!
    shaft = cyl_x(3.15, -64.0, -47.0, 0.0, Z_SPINDLE)
    # Rear JST power connector housing on top (+Z) of rear cap
    conn = box(-117.0, -107.0, -8.0, 8.0, Z_SPINDLE + half - 1.0, Z_SPINDLE + half + 6.0)

    motor = fuse_all([body, flange, boss, shaft, conn])
    cuts = []
    # Corner reliefs on stator stack behind flange (X=[-112, -69]) so NEMA-23 bolts are exposed
    for sy in (-1.0, 1.0):
        for sz in (-1.0, 1.0):
            # Mounting bolt clearance holes in flange
            cuts.append(cyl_x(2.65, -70.0, -63.5, sy * 23.57, Z_SPINDLE + sz * 23.57))
            # Stator corner pocket exposing bolt head
            cx = -112.0
            cy = sy * 23.57
            cz = Z_SPINDLE + sz * 23.57
            cuts.append(cyl_x(5.2, -112.0, -69.0, cy, cz))
    return cut_all(motor, cuts)


def build_bumpers():
    """4x Shore 70A elastomer end-stop bumpers: X=[0,6] & [234,240], Y=±32, Z_c=53 (Ø10 mm)."""
    parts = []
    for y in (-32.0, 32.0):
        parts.append(cyl_x(5.0, 0.05, BUMPER_T, y, 53.0))
        parts.append(cyl_x(5.0, L_BASE - BUMPER_T, L_BASE - 0.05, y, 53.0))
    return Part.makeCompound(parts)


def build_sensors():
    """2x Side Limit Switch Brackets (X=70 & X=170, Y=[42,56], Z=[14,28]) + M8 inductive sensors (Z=[18,42])."""
    parts = []
    for xs in (STROKE_USE_MIN, STROKE_USE_MAX):
        # L-shaped Al bracket bolted flush to Base +Y wall (Y=42.0), well below MGN12H blocks (Z=37)!
        br = box(xs - 8.0, xs + 8.0, 42.05, 56.0, 14.0, 28.0)
        br_cuts = [
            cyl_z(4.15, 13.5, 28.5, xs, 50.0),                 # M8 sensor bore
            cyl_y(2.25, 41.5, 56.5, xs - 5.0, 21.0),           # M4 mounting bolt
            cyl_y(2.25, 41.5, 56.5, xs + 5.0, 21.0),           # M4 mounting bolt
        ]
        # Cut open front pocket on bracket so M4 heads clear sensor barrel
        br_cuts.append(box(xs - 8.5, xs + 8.5, 46.0, 56.5, 14.0, 23.0))
        parts.append(cut_all(br, br_cuts))

        # M8x1 inductive sensor barrel (Ø8.0, Z=[18, 42.0]) + two hex locknuts (above & below bracket)
        barrel = cyl_z(3.95, 18.0, 42.0, xs, 50.0)
        # Cable strain-relief boot below barrel
        boot = cyl_z(2.8, 12.0, 18.0, xs, 50.0)
        # Two hex locknuts (SW 13 mm) at Z=[28.1, 31.1] and Z=[20.0, 22.8]
        def hex_nut(z0, z1):
            r = 6.5
            pts = [V(xs + r * math.cos(i * math.pi / 3), 50.0 + r * math.sin(i * math.pi / 3), z0) for i in range(6)]
            pts.append(pts[0])
            return Part.Face(Part.makePolygon(pts)).extrude(V(0, 0, z1 - z0))
        n_top = hex_nut(28.1, 31.0)
        n_bot = hex_nut(20.0, 22.8)
        parts.append(fuse_all([barrel, boot, n_top, n_bot]))

    return Part.makeCompound(parts)


def build_flag():
    """Bent 2 mm DC01 sheet-metal trigger flag bolted flush to Carriage Table (+Y=48.0, Z=[44,56])."""
    # Vertical mounting leg flush against table +Y face: Y=[48.05, 50.05], X=[-10, +10], Z=[44.0, 56.0]
    vert = box(-10.0, 10.0, 48.05, 50.05, 44.0, 56.0)
    # Horizontal inductive target tab at Z=[44.0, 46.0] (2.0 mm sensing gap directly over Z=42.0 M8 sensor!)
    horiz = box(-10.0, 10.0, 48.05, 54.0, 44.0, 46.0)
    flag = fuse_all([vert, horiz])
    # 2x Ø3.4 mounting holes matching table side M3 tapped holes (X=±6, Z=53)
    cuts = [cyl_y(1.7, 47.5, 50.5, -6.0, 53.0), cyl_y(1.7, 47.5, 50.5, 6.0, 53.0)]
    return cut_all(flag, cuts)


def build_fasteners():
    """Standardized DIN 912 SHCS & ISO 2338 Dowels split into (stator_fasteners, carriage_fasteners)."""
    stator_list = []
    carriage_list = []

    # 18x M3x8 rail mounting screws seated in rail counterbores (Z_head_bot = 37.6)
    for x in range(20, 221, 25):
        for y in (-Y_RAIL, Y_RAIL):
            stator_list.append(make_shcs_z(float(x), y, 37.6, 2.9, 6.0, 5.4, 2.9, z_dir=-1))

    # 4x M5x20 fixed bearing housing bolts + 4x M5x18 floating bearing housing bolts
    for y, z in [(-32.0, 16.0), (32.0, 16.0), (-14.0, 6.0), (14.0, 6.0)]:
        stator_list.append(make_shcs_x(-T_FIXED + 6.6, y, z, 4.9, 16.0, 8.4, 4.9, x_dir=+1))
        stator_list.append(make_shcs_x(L_BASE + T_FLOAT - 6.6, y, z, 4.9, 16.0, 8.4, 4.9, x_dir=-1))

    # 4x Ø4x12 ISO 2338 locating dowel pins (2 fixed end, 2 floating end)
    for y, z in [(-32.0, 6.0), (32.0, 6.0)]:
        stator_list.append(cyl_x(1.98, -6.5, 6.5, y, z))
        stator_list.append(cyl_x(1.98, L_BASE - 6.5, L_BASE + 6.5, y, z))

    # 4x M4x10 bearing retainer cap screws (X_seat = -26.85)
    for ang in (45, 135, 225, 315):
        hy = 18.0 * math.cos(math.radians(ang))
        hz = Z_SPINDLE + 18.0 * math.sin(math.radians(ang))
        stator_list.append(make_shcs_x(-26.85, hy, hz, 3.9, 9.0, 6.9, 3.8, x_dir=+1))

    # 4x M5x12 lantern-to-housing screws (X_seat = -29.9)
    for y in (-26.0, 26.0):
        for z in (8.0, 52.0):
            stator_list.append(make_shcs_x(-29.9, y, z, 4.9, 12.0, 8.4, 4.9, x_dir=+1))

    # 4x M5x14 NEMA-23 motor mounting screws (X_seat = -69.05)
    for sy in (-1.0, 1.0):
        for sz in (-1.0, 1.0):
            stator_list.append(make_shcs_x(-69.05, sy * 23.57, Z_SPINDLE + sz * 23.57, 4.9, 13.0, 8.4, 4.9, x_dir=+1))

    # 4x M4x10 sensor bracket screws (Y_seat = 45.95)
    for xs in (STROKE_USE_MIN, STROKE_USE_MAX):
        for dx in (-5.0, 5.0):
            stator_list.append(make_shcs_y(xs + dx, 45.95, 21.0, 3.9, 9.0, 6.9, 3.8, y_dir=-1))

    # CARRIAGE FASTENERS:
    # 16x M3x12 table-to-MGN12H-block bolts (Z_seat = 54.6)
    for xc in (-X_BLOCK_C, X_BLOCK_C):
        for dx in (-10.0, 10.0):
            for yc in (-Y_RAIL, Y_RAIL):
                for dy in (-10.0, 10.0):
                    carriage_list.append(make_shcs_z(xc + dx, yc + dy, 54.6, 2.9, 11.0, 5.4, 2.9, z_dir=-1))

    # 4x M4x14 table-to-nut-saddle bolts (Z_seat = 53.6)
    for hx in (-10.0, 4.0):
        for hy in (-11.0, 11.0):
            carriage_list.append(make_shcs_z(hx, hy, 53.6, 3.9, 13.0, 6.9, 3.9, z_dir=-1))

    # 4x M4x16 SFU1204 nut-flange-to-saddle axial bolts (X_seat = +18.05, shank goes -X into saddle!)
    for sy in (-1.0, 1.0):
        for sz in (-1.0, 1.0):
            hy = sy * 16.0 * math.cos(math.radians(30.0))
            hz = Z_SPINDLE + sz * 16.0 * math.sin(math.radians(30.0))
            carriage_list.append(make_shcs_x(18.05, hy, hz, 3.9, 16.0, 6.9, 3.8, x_dir=-1))

    # 2x M3x8 trigger flag mounting screws (Y_seat = 50.1)
    for hx in (-6.0, 6.0):
        carriage_list.append(make_shcs_y(hx, 50.1, 53.0, 2.9, 7.5, 5.4, 2.5, y_dir=-1))

    return Part.makeCompound(stator_list), Part.makeCompound(carriage_list)


# =============================================================================
# 4. BUILD, VERIFY INTERFERENCE & EXPORT
# =============================================================================
def main():
    t0 = time.time()
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    models_dir = os.path.join(repo_root, "models")
    os.makedirs(models_dir, exist_ok=True)

    print("Building PLA-100 v2 B-Rep solids...")
    coupling_hubs, coupling_spider = build_coupling()
    fast_stator, fast_carriage = build_fasteners()

    parts_spec = [
        # (key, pos, label, material, standard, is_carriage, rot_axis, shape, linear_deflection, color_rgb)
        ("base", 1, "Base Profile (PLA-100-10-01)", "EN AW-6082 T6", "Custom CNC U-Profile", False, False, build_base(), 0.25, (0.78, 0.82, 0.86)),
        ("rail_left", 2, "Linear Rail Left", "100Cr6 hardened", "HIWIN MGN12 - L240", False, False, build_rail(-Y_RAIL), 0.18, (0.88, 0.90, 0.94)),
        ("rail_right", 3, "Linear Rail Right", "100Cr6 hardened", "HIWIN MGN12 - L240", False, False, build_rail(Y_RAIL), 0.18, (0.88, 0.90, 0.94)),
        ("blocks", 4, "4x Linear Carriages", "100Cr6 / POM", "HIWIN MGN12H (Z1)", True, False, build_blocks(), 0.20, (0.20, 0.26, 0.34)),
        ("spindle", 5, "Ball Screw Spindle", "CF53 / 100Cr6", "SFU1204 Ø12x4 (IT5)", False, True, build_spindle(), 0.25, (0.90, 0.93, 0.97)),
        ("nut", 6, "Flanged Ball Nut", "16MnCr5 case-hardened", "DIN 69051 Form B Ø12x4", True, False, build_nut(), 0.22, (0.32, 0.38, 0.46)),
        ("nut_saddle", 7, "Nut Mounting Saddle", "EN AW-6082 T6", "PLA-100-20-02", True, False, build_nut_saddle(), 0.22, (0.72, 0.77, 0.83)),
        ("table", 8, "Carriage Table", "EN AW-7075 T6 anodized", "PLA-100-20-01 (100x96)", True, False, build_table(), 0.22, (0.04, 0.48, 0.76)),
        ("fixed_bearing", 9, "Fixed Bearing Housing", "EN AW-6082 T6", "BK10-style (Ø28 H7)", False, False, build_fixed_bearing_housing(), 0.22, (0.70, 0.76, 0.82)),
        ("bearings_fixed", 10, "Duplex Bearings 7001-B + Cap & KM0", "100Cr6 hardened", "2x 7001-B (O-Pair) + KM0", False, False, build_fixed_bearings_kit(), 0.22, (0.84, 0.68, 0.30)),
        ("floating_bearing", 11, "Floating Bearing Housing", "EN AW-6082 T6", "BF10-style (+0.5 mm float)", False, False, build_floating_bearing_housing(), 0.22, (0.70, 0.76, 0.82)),
        ("bearing_float", 12, "Floating Bearing 6001 + Circlip", "100Cr6 hardened", "DIN 625 6001 + DIN 471", False, False, build_floating_bearing_kit(), 0.22, (0.84, 0.68, 0.30)),
        ("lantern", 13, "Motor Lantern Housing", "EN AW-6082 T6", "PLA-100-10-04 (NEMA 23)", False, False, build_motor_lantern(), 0.22, (0.64, 0.70, 0.77)),
        ("coupling", 14, "Jaw Coupling Hubs", "EN AW-6082 T6", "D25 L30 Zero-Backlash", False, True, coupling_hubs, 0.20, (0.74, 0.79, 0.85)),
        ("coupling_spider", 15, "Elastomer Spider", "PUR 98 Sh-A", "D25 6-Lobe Elastomer", False, True, coupling_spider, 0.20, (0.90, 0.22, 0.20)),
        ("motor", 16, "NEMA 23 Stepper Motor", "Die-cast Al / Cu / Fe", "NEMA 23 (56.4x56.4x56)", False, False, build_motor(), 0.25, (0.14, 0.18, 0.24)),
        ("bumpers", 17, "4x Elastomer End-Stops", "NBR 70 Sh-A", "Ø10x6 Shore 70A", False, False, build_bumpers(), 0.20, (0.12, 0.14, 0.18)),
        ("sensors", 18, "Limit Brackets & 2x M8 Sensors", "Brass Ni-plated / PBT", "2x M8x1 Inductive (X=70/170)", False, False, build_sensors(), 0.22, (0.82, 0.72, 0.42)),
        ("flag", 19, "Bolted Trigger Flag", "DC01 galvanized", "DIN EN 10130 (2 mm bent)", True, False, build_flag(), 0.20, (0.85, 0.88, 0.92)),
        ("fasteners_stator", 20, "Stator Fasteners & Dowels", "Steel 8.8 / A2-70", "DIN 912 M3/M4/M5 + ISO 2338", False, False, fast_stator, 0.28, (0.30, 0.34, 0.40)),
        ("fasteners_carriage", 21, "Carriage Fasteners", "Steel 8.8 / A2-70", "DIN 912 M3/M4 (26 pcs)", True, False, fast_carriage, 0.28, (0.30, 0.34, 0.40)),
    ]

    shapes_by_key = {p[0]: p[7] for p in parts_spec}
    is_car_by_key = {p[0]: p[5] for p in parts_spec}

    # =========================================================================
    # 5. AUTOMATED B-REP INTERFERENCE & CLEARANCE VERIFICATION
    # =========================================================================
    print("\nRunning B-Rep geometric clearance & interference checks...")
    def placed(key, stroke_x):
        s = shapes_by_key[key]
        if is_car_by_key[key]:
            s = s.copy()
            s.translate(V(stroke_x, 0, 0))
        return s

    # Critical physical clearances
    bb_motor = shapes_by_key["motor"].BoundBox
    bb_base = shapes_by_key["base"].BoundBox
    bb_nut = shapes_by_key["nut"].BoundBox
    bb_blocks = shapes_by_key["blocks"].BoundBox
    bb_flag = shapes_by_key["flag"].BoundBox
    bb_table = shapes_by_key["table"].BoundBox

    checks = {
        "motor_above_datum_A_mm": round(bb_motor.ZMin - bb_base.ZMin, 3),
        "nut_above_base_floor_mm": round(bb_nut.ZMin - Z_FLOOR, 3),
        "blocks_inside_rail_front_stop_mm": round((STROKE_MIN + bb_blocks.XMin) - 0.0, 3),
        "blocks_inside_rail_rear_stop_mm": round(L_BASE - (STROKE_MAX + bb_blocks.XMax), 3),
        "table_outer_wall_outside_m3_cbore_mm": round((W_TABLE / 2.0) - (41.0 + 3.1), 3),
        "flag_to_table_gap_mm": round(bb_flag.YMin - bb_table.YMax, 3),
        "flag_to_m8_sensor_sensing_gap_mm": round(bb_flag.ZMin - 42.0, 3),
    }
    print("  Clearances:", json.dumps(checks, indent=2))
    assert checks["motor_above_datum_A_mm"] >= 1.5, f"Motor below Datum A: {checks}"
    assert checks["nut_above_base_floor_mm"] >= 2.5, f"Nut hits base floor: {checks}"
    assert checks["blocks_inside_rail_front_stop_mm"] >= 5.0, f"Blocks overrun front rail: {checks}"
    assert checks["blocks_inside_rail_rear_stop_mm"] >= 5.0, f"Blocks overrun rear rail: {checks}"
    assert checks["table_outer_wall_outside_m3_cbore_mm"] >= 3.0, f"Table counterbores break wall: {checks}"
    assert checks["flag_to_table_gap_mm"] <= 0.1, f"Flag floats from table: {checks}"
    assert 1.5 <= checks["flag_to_m8_sensor_sensing_gap_mm"] <= 3.0, f"Sensor gap out of range: {checks}"

    # Pairwise exact B-Rep Boolean volume interference checks across full travel
    critical_pairs = [
        ("motor", "coupling"),
        ("motor", "spindle"),
        ("motor", "lantern"),
        ("coupling", "lantern"),
        ("coupling_spider", "lantern"),
        ("coupling", "bearings_fixed"),
        ("spindle", "base"),
        ("spindle", "fixed_bearing"),
        ("spindle", "floating_bearing"),
        ("spindle", "nut"),
        ("nut", "base"),
        ("nut", "nut_saddle"),
        ("nut_saddle", "blocks"),
        ("nut_saddle", "base"),
        ("blocks", "rail_left"),
        ("blocks", "rail_right"),
        ("blocks", "base"),
        ("blocks", "sensors"),
        ("table", "sensors"),
        ("table", "flag"),
        ("flag", "sensors"),
        ("flag", "blocks"),
        ("table", "bumpers"),
        ("table", "fixed_bearing"),
        ("table", "floating_bearing"),
        ("bearings_fixed", "fixed_bearing"),
        ("bearing_float", "floating_bearing"),
    ]
    max_interference = 0.0
    failures = []
    for xs in (STROKE_MIN, STROKE_USE_MIN, STROKE_CENTER, STROKE_USE_MAX, STROKE_MAX):
        for a, b in critical_pairs:
            # Skip static-static repeats after first stroke
            if xs != STROKE_MIN and not (is_car_by_key[a] or is_car_by_key[b]):
                continue
            sa, sb = placed(a, xs), placed(b, xs)
            if not sa.BoundBox.intersect(sb.BoundBox):
                continue
            inter = sa.common(sb)
            vol = inter.Volume if inter and not inter.isNull() else 0.0
            if vol > max_interference:
                max_interference = vol
            if vol > 0.25:
                failures.append((xs, a, b, round(vol, 3)))

    print(f"  Max pairwise B-Rep interference volume across stroke: {max_interference:.4f} mm^3")
    if failures:
        print("  INTERFERENCE FAILURES:", failures)
        sys.exit(1)
    print("  ALL B-REP INTERFERENCE CHECKS PASSED (0 collisions)!")

    # =========================================================================
    # 6. EXPORT STLs + NAMED STEP AP214 + MANIFEST
    # =========================================================================
    print("\nExporting binary STLs & named STEP AP214 assembly...")
    doc = FreeCAD.newDocument("PLA100_v2")
    step_objs = []
    manifest_parts = []
    total_mass_kg = 0.0

    for key, pos, label, mat_name, std, is_car, rot_axis, shape, lin_defl, color_rgb in parts_spec:
        stl_name = f"pla100_{key}.stl"
        stl_path = os.path.join(models_dir, stl_name)
        m = MeshPart.meshFromShape(Shape=shape, LinearDeflection=lin_defl, AngularDeflection=0.45, Relative=False)
        m.write(stl_path)

        vol_mm3 = shape.Volume
        mass_kg = vol_mm3 * DENSITY.get(mat_name, 2.70e-6)
        total_mass_kg += mass_kg
        bb = shape.BoundBox
        manifest_parts.append({
            "key": key,
            "pos": pos,
            "name": label,
            "file": f"models/{stl_name}",
            "material": mat_name,
            "standard": std,
            "isCarriage": is_car,
            "rotAxis": rot_axis,
            "triangles": m.CountFacets,
            "volume_cm3": round(vol_mm3 / 1000.0, 2),
            "mass_g": round(mass_kg * 1000.0, 1),
            "bbox": {
                "min": [round(bb.XMin, 2), round(bb.YMin, 2), round(bb.ZMin, 2)],
                "max": [round(bb.XMax, 2), round(bb.YMax, 2), round(bb.ZMax, 2)],
            },
        })

        # Add to FreeCAD document positioned at nominal center X=120 for STEP assembly export
        obj = doc.addObject("Part::Feature", f"Pos{pos:02d}_{key}")
        obj.Label = f"Pos {pos:02d} - {label}"
        s_step = placed(key, STROKE_CENTER)
        obj.Shape = s_step
        step_objs.append(obj)
        print(f"  Pos {pos:02d} {key:20s}: tris={m.CountFacets:5d} | mass={mass_kg*1000:6.1f} g | {os.path.getsize(stl_path)//1024:4d} KB")

    doc.recompute()
    step_path = os.path.join(models_dir, "PLA-100-00-00_Gesamtbaugruppe.step")
    Import.export(step_objs, step_path)
    step_kb = os.path.getsize(step_path) // 1024
    print(f"\nSTEP AP214 exported: {step_path} ({step_kb} KB, {len(step_objs)} named parts)")

    # Remove dead legacy files if present
    for legacy in ("pla100_stator.stl", "pla100_carriage.stl", "pla100_sensor_bracket.stl"):
        lp = os.path.join(models_dir, legacy)
        if os.path.exists(lp):
            os.remove(lp)
            print(f"  Removed obsolete legacy file: {legacy}")

    manifest = {
        "version": "2.0.0",
        "assembly": "PLA-100-00-00",
        "parts_count": len(manifest_parts),
        "total_mass_kg": round(total_mass_kg, 3),
        "step_size_kb": step_kb,
        "stroke": {
            "hard_min_mm": STROKE_MIN,
            "use_min_mm": STROKE_USE_MIN,
            "center_mm": STROKE_CENTER,
            "use_max_mm": STROKE_USE_MAX,
            "hard_max_mm": STROKE_MAX,
            "usable_mm": STROKE_USE_MAX - STROKE_USE_MIN,
            "max_free_mm": STROKE_MAX - STROKE_MIN,
        },
        "spindle_z_mm": Z_SPINDLE,
        "pitch_mm": PITCH,
        "clearances_verified": checks,
        "max_interference_mm3": round(max_interference, 4),
        "parts": manifest_parts,
    }
    manifest_path = os.path.join(models_dir, "pla100_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Total system mass (computed from B-Rep): {total_mass_kg:.3f} kg")
    print(f"Finished cleanly in {time.time()-t0:.2f}s!")


if __name__ == "__main__":
    main()
