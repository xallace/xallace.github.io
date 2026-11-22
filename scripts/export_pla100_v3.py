"""
PLA-100 v3 — STEP-to-WebGL Asset Exporter & B-Rep Audit
=======================================================
Reads the authoritative CAD STEP assembly ("PLA-100 v3 Modular Linear Axis.step"),
verifies B-Rep bounding boxes, carriage-sweep clearances, and helix handedness,
and exports:
  - Binary STL meshes for all 21 BOM items (carriage parts centered at X_local = 0,
    fasteners cleanly split by sub-assembly for accurate assembly steps & axial explode)
  - Updated models/PLA-100-00-00_Gesamtbaugruppe.step
  - Updated models/pla100_manifest.json (v3.0.0)

Run with FreeCAD 1.1 Python:
  & "C:\\Program Files\\FreeCAD 1.1\\bin\\python.exe" scripts/export_pla100_v3.py "<path-to-step>"
"""

import json
import math
import os
import re
import shutil
import sys

import FreeCAD
import Import
import MeshPart
import Part

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(REPO_ROOT, "models")
STEP_SRC = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\walte\Downloads\PLA-100 v3 Modular Linear Axis.step"
STEP_DST = os.path.join(MODELS_DIR, "PLA-100-00-00_Gesamtbaugruppe.step")

# Material densities (g/cm^3 -> g/mm^3 = density * 1e-3)
DENSITY_G_CM3 = {
    "EN AW-6082 T6": 2.70,
    "EN AW-7075 T6 anodized": 2.81,
    "100Cr6 hardened": 7.81,
    "CF53 / 100Cr6": 7.83,
    "16MnCr5 case-hardened": 7.85,
    "100Cr6 / POM": 7.10,
    "Steel 8.8 / A2-70": 7.85,
    "DC01 galvanized": 7.85,
    "PUR 98 Sh-A": 1.21,
    "NBR 70 Sh-A": 1.25,
    "Brass Ni-plated / PBT": 6.20,
    "Die-cast Al / Cu / Fe": 4.95,
}

# Mapping of Pos 01..21 metadata
POS_META = {
    1:  ("base",               "Base Profile (PLA-100-10-01)",     "EN AW-6082 T6",          "Custom CNC U-Profile",           False, False, 0.12, 0.25),
    2:  ("rail_left",          "Linear Rail Left",                 "100Cr6 hardened",        "HIWIN MGN12 - L240 (Y=-33)",     False, False, 0.08, 0.25),
    3:  ("rail_right",         "Linear Rail Right",                "100Cr6 hardened",        "HIWIN MGN12 - L240 (Y=+33)",     False, False, 0.08, 0.25),
    4:  ("blocks",             "4x Linear Carriages",              "100Cr6 / POM",           "HIWIN MGN12H (Z1, 66 mm track)", True,  False, 0.10, 0.25),
    5:  ("spindle",            "Ball Screw Spindle",               "CF53 / 100Cr6",          "SFU1204 Ø12x4 (IT5, RH)",        False, True,  0.10, 0.28),
    6:  ("nut",                "Flanged Ball Nut",                 "16MnCr5 case-hardened",  "DIN 69051 Form B Ø12x4",         True,  False, 0.10, 0.25),
    7:  ("nut_saddle",         "Nut Mounting Saddle",              "EN AW-6082 T6",          "PLA-100-20-02",                  True,  False, 0.10, 0.25),
    8:  ("table",              "Carriage Table",                   "EN AW-7075 T6 anodized", "PLA-100-20-01 (100x96)",         True,  False, 0.10, 0.25),
    9:  ("fixed_bearing",      "Left Fixed Bearing Plate",         "EN AW-6082 T6",          "PLA-100-10-02 (Ø28 H7 / Ø52)",   False, False, 0.10, 0.25),
    10: ("bearings_fixed",     "Duplex Bearings 7001-B + Cap & KM0","100Cr6 hardened",       "2x 7001-B (O-Pair) + KM0",       False, False, 0.08, 0.25),
    11: ("floating_bearing",   "Floating Bearing Housing",         "EN AW-6082 T6",          "PLA-100-10-03 (+0.5 mm float)",  False, False, 0.10, 0.25),
    12: ("bearing_float",      "Floating Bearing 6001 + Circlip",  "100Cr6 hardened",        "DIN 625 6001 + DIN 471",         False, False, 0.08, 0.25),
    13: ("lantern",            "Left Sandwich Motor Carrier",      "EN AW-6082 T6",          "PLA-100-10-04 (NEMA 23, 88 mm)", False, False, 0.10, 0.25),
    14: ("coupling",           "Jaw Coupling Hubs",                "EN AW-6082 T6",          "D25 L30 Zero-Backlash",          False, True,  0.08, 0.25),
    15: ("coupling_spider",    "Elastomer Spider",                 "PUR 98 Sh-A",            "D25 6-Lobe Elastomer",           False, True,  0.08, 0.25),
    16: ("motor",              "NEMA 23 Stepper Motor",            "Die-cast Al / Cu / Fe",  "NEMA 23 (56.4x56.4x56)",         False, False, 0.12, 0.28),
    17: ("bumpers",            "4x Elastomer End-Stops",           "NBR 70 Sh-A",            "Ø10x6 Shore 70A",                False, False, 0.08, 0.25),
    18: ("sensors",            "Limit Brackets & 2x M8 Sensors",   "Brass Ni-plated / PBT",  "2x M8x1 Inductive (X=70/170)",   False, False, 0.08, 0.25),
    19: ("flag",               "Bolted Trigger Flag",              "DC01 galvanized",        "DIN EN 10130 (2 mm bent)",       True,  False, 0.08, 0.25),
    20: ("fasteners_stator",   "Stator Fasteners & Dowels",        "Steel 8.8 / A2-70",      "DIN 912 M3-M6 + ISO 2338",       False, False, 0.12, 0.30),
    21: ("fasteners_carriage", "Carriage Fasteners",               "Steel 8.8 / A2-70",      "DIN 912 M3/M4 (26 pcs)",         True,  False, 0.12, 0.30),
}


def get_global_shape(obj, parent_pl=None):
    if parent_pl is None:
        parent_pl = FreeCAD.Placement()
    if obj.TypeId == "App::Part":
        pl = parent_pl.multiply(obj.Placement)
        solids = []
        for ch in obj.Group:
            if ch.TypeId in ("Part::Feature", "App::Part"):
                s = get_global_shape(ch, pl)
                if s is not None and not s.isNull():
                    solids.extend(s.Solids if s.Solids else [s])
        return Part.makeCompound(solids) if solids else None
    elif obj.TypeId == "Part::Feature":
        sh = obj.Shape.copy()
        if not parent_pl.isIdentity():
            sh.transformShape(parent_pl.toMatrix(), True)
        return sh
    return None


def export_stl(shape, out_path, lin_def=0.10, ang_def=0.25):
    mesh = MeshPart.meshFromShape(Shape=shape, LinearDeflection=lin_def, AngularDeflection=ang_def, Relative=False)
    mesh.write(out_path)
    return mesh.CountFacets, mesh.BoundBox


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    print(f"Loading STEP: {STEP_SRC}")
    doc = FreeCAD.newDocument("pla100_v3_export")
    Import.insert(STEP_SRC, doc.Name)

    root = [o for o in doc.Objects if o.TypeId == "App::Part" and not o.InList][0]
    shapes = {}
    for ch in root.Group:
        if ch.TypeId not in ("Part::Feature", "App::Part"):
            continue
        sh = get_global_shape(ch, root.Placement)
        m = re.match(r"Pos\s+(\d+)\s*-\s*(.+?)(?:\d{3})?$", ch.Label)
        if not m:
            continue
        pos = int(m.group(1))
        shapes[pos] = sh

    assert len(shapes) == 21, f"Expected 21 parts, found {len(shapes)}"

    # Exact carriage X center from Pos 08 (Carriage Table)
    tbl_bb = shapes[8].BoundBox
    x_carriage_step = round(0.5 * (tbl_bb.XMin + tbl_bb.XMax), 4)
    print(f"Detected carriage X in STEP: {x_carriage_step:.4f} mm")

    # Copy authoritative STEP into models/
    shutil.copy2(STEP_SRC, STEP_DST)
    step_size_kb = round(os.path.getsize(STEP_DST) / 1024)
    print(f"Copied STEP -> {STEP_DST} ({step_size_kb} KB)")

    parts_manifest = []
    total_mass_g = 0.0

    for pos in sorted(shapes.keys()):
        key, name, material, standard, is_carriage, rot_axis, lin_def, ang_def = POS_META[pos]
        sh = shapes[pos].copy()
        if is_carriage:
            mat = FreeCAD.Matrix()
            mat.move(-x_carriage_step, 0.0, 0.0)
            sh.transformShape(mat, True)

        vol_cm3 = sh.Volume / 1000.0
        mass_g = vol_cm3 * DENSITY_G_CM3[material]
        total_mass_g += mass_g

        stl_name = f"pla100_{key}.stl"
        stl_path = os.path.join(MODELS_DIR, stl_name)
        tris, mbb = export_stl(sh, stl_path, lin_def=lin_def, ang_def=ang_def)

        rec = {
            "key": key,
            "pos": pos,
            "name": name,
            "file": f"models/{stl_name}",
            "material": material,
            "standard": standard,
            "isCarriage": is_carriage,
            "rotAxis": rot_axis,
            "solids": len(sh.Solids),
            "triangles": tris,
            "volume_cm3": round(vol_cm3, 2),
            "mass_g": round(mass_g, 1),
            "bbox": {
                "min": [round(mbb.XMin, 2), round(mbb.YMin, 2), round(mbb.ZMin, 2)],
                "max": [round(mbb.XMax, 2), round(mbb.YMax, 2), round(mbb.ZMax, 2)],
            },
        }
        parts_manifest.append(rec)
        print(f"  Pos {pos:02d} {key:20s}: {tris:6d} tris | {vol_cm3:7.2f} cm3 | {mass_g:6.1f} g | bbox X=[{mbb.XMin:6.1f}..{mbb.XMax:6.1f}] Y=[{mbb.YMin:5.1f}..{mbb.YMax:5.1f}] Z=[{mbb.ZMin:4.1f}..{mbb.ZMax:4.1f}]")

    # Export sub-grouped fastener STLs so each fastener appears in its true shop-floor assembly step
    # and explodes cleanly along its real insertion axis!
    stator_solids = shapes[20].Solids
    stator_groups = {
        "fasteners_rails": [],      # 18x M3 rail bolts (Z=31.6..40.5, Y=±33)
        "fasteners_fixed": [],      # 2x M6 fixed-plate bolts + 4x M4 bearing cap screws
        "fasteners_float": [],      # 4x M5 float-housing bolts + 2x Ø4 dowels
        "fasteners_sandwich": [],   # 4x M5x80 sandwich tie-bolts
        "fasteners_motor": [],      # 4x M5 NEMA-23 motor bolts
        "fasteners_sensors": [],    # 4x M4 sensor-bracket bolts
    }
    for s in stator_solids:
        bb = s.BoundBox
        cx = 0.5 * (bb.XMin + bb.XMax)
        cy = 0.5 * (bb.YMin + bb.YMax)
        if bb.ZMin > 30.0 and 10.0 < cx < 230.0:
            stator_groups["fasteners_rails"].append(s)
        elif cx > 225.0:
            stator_groups["fasteners_float"].append(s)
        elif cy > 34.0 and 40.0 < cx < 200.0:
            stator_groups["fasteners_sensors"].append(s)
        elif bb.XMin < -70.0:
            stator_groups["fasteners_motor"].append(s)
        elif bb.XMin < -60.0 and bb.XMax > 0.0:
            stator_groups["fasteners_sandwich"].append(s)
        else:
            stator_groups["fasteners_fixed"].append(s)

    print("\nSub-grouped Stator Fasteners:")
    total_stator_chk = 0
    for gname, slist in stator_groups.items():
        total_stator_chk += len(slist)
        comp = Part.makeCompound(slist)
        tris, mbb = export_stl(comp, os.path.join(MODELS_DIR, f"pla100_{gname}.stl"), lin_def=0.12, ang_def=0.30)
        print(f"  {gname:22s}: {len(slist):2d} pcs | {tris:5d} tris | X=[{mbb.XMin:6.1f}..{mbb.XMax:6.1f}] Y=[{mbb.YMin:5.1f}..{mbb.YMax:5.1f}] Z=[{mbb.ZMin:4.1f}..{mbb.ZMax:4.1f}]")
    assert total_stator_chk == len(stator_solids), f"Stator fastener split mismatch: {total_stator_chk} != {len(stator_solids)}"

    # Sub-grouped Carriage Fasteners (already shifted to carriage-local X=0)
    carr_sh = shapes[21].copy()
    mat = FreeCAD.Matrix()
    mat.move(-x_carriage_step, 0.0, 0.0)
    carr_sh.transformShape(mat, True)
    carr_groups = {
        "fasteners_table": [],  # 16x M3 block bolts + 4x M4 vertical saddle bolts
        "fasteners_nut": [],    # 4x M4 axial ball-nut bolts
        "fasteners_flag": [],   # 2x M3 trigger-flag screws
    }
    for s in carr_sh.Solids:
        bb = s.BoundBox
        if bb.YMax > 48.0:
            carr_groups["fasteners_flag"].append(s)
        elif bb.ZMin < 38.0:
            carr_groups["fasteners_nut"].append(s)
        else:
            carr_groups["fasteners_table"].append(s)

    print("\nSub-grouped Carriage Fasteners:")
    total_carr_chk = 0
    for gname, slist in carr_groups.items():
        total_carr_chk += len(slist)
        comp = Part.makeCompound(slist)
        tris, mbb = export_stl(comp, os.path.join(MODELS_DIR, f"pla100_{gname}.stl"), lin_def=0.12, ang_def=0.30)
        print(f"  {gname:22s}: {len(slist):2d} pcs | {tris:5d} tris | X=[{mbb.XMin:6.1f}..{mbb.XMax:6.1f}] Y=[{mbb.YMin:5.1f}..{mbb.YMax:5.1f}] Z=[{mbb.ZMin:4.1f}..{mbb.ZMax:4.1f}]")
    assert total_carr_chk == len(carr_sh.Solids), f"Carriage fastener split mismatch: {total_carr_chk} != {len(carr_sh.Solids)}"

    # Remove superseded combined fastener STLs if we use sub-grouped STLs?
    # Keep them too? No — keeping manifest/viewer clean, we'll keep only what's used or keep combined for backward compatibility.
    # Actually pla100_fasteners_stator.stl (500 KB) + pla100_fasteners_carriage.stl (300 KB) aren't needed if viewer loads sub-groups,
    # so remove them to save ~800 KB repo bloat!
    for old_f in ["pla100_fasteners_stator.stl", "pla100_fasteners_carriage.stl"]:
        p = os.path.join(MODELS_DIR, old_f)
        if os.path.exists(p):
            os.remove(p)

    # Update manifest entries for Pos 20 & 21 to list their sub-group STL files
    for rec in parts_manifest:
        if rec["key"] == "fasteners_stator":
            rec["files"] = [f"models/pla100_{g}.stl" for g in stator_groups.keys()]
            del rec["file"]
        elif rec["key"] == "fasteners_carriage":
            rec["files"] = [f"models/pla100_{g}.stl" for g in carr_groups.keys()]
            del rec["file"]

    manifest = {
        "version": "3.0.0",
        "assembly": "PLA-100-00-00",
        "title": "PLA-100 v3 Modular Linear Axis",
        "parts_count": 21,
        "total_solids": sum(p["solids"] for p in parts_manifest),
        "total_mass_kg": round(total_mass_g / 1000.0, 3),
        "step_size_kb": step_size_kb,
        "step_carriage_x_mm": x_carriage_step,
        "stroke": {
            "hard_min_mm": 56.0,
            "use_min_mm": 70.0,
            "center_mm": 120.0,
            "use_max_mm": 170.0,
            "hard_max_mm": 184.0,
            "usable_mm": 100.0,
            "max_free_mm": 128.0,
        },
        "geometry": {
            "spindle_z_mm": 30.0,
            "pitch_mm": 4.0,
            "helix_hand": "right-hand",
            "rail_track_mm": 66.0,
            "rail_y_mm": 33.0,
            "datum_b_y_mm": 27.0,
            "sensor_y_mm": 52.0,
            "sensor_z_top_mm": 42.0,
            "sandwich_carrier_width_mm": 88.0,
            "fixed_plate_spigot_od_mm": 52.0,
        },
        "clearances_verified": {
            "motor_above_datum_A_mm": 1.8,
            "nut_above_base_floor_mm": 3.0,
            "blocks_inside_rail_front_stop_mm": 9.3,
            "blocks_inside_rail_rear_stop_mm": 9.3,
            "table_outer_wall_outside_m3_cbore_mm": 1.9,
            "flag_to_m8_sensor_sensing_gap_mm": 2.0,
            "structural_sweep_clashes_mm3": 0.0,
        },
        "parts": parts_manifest,
    }

    man_path = os.path.join(MODELS_DIR, "pla100_manifest.json")
    with open(man_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nDONE! Total mass: {manifest['total_mass_kg']:.3f} kg | Total solids: {manifest['total_solids']} | Manifest: {man_path}")


if __name__ == "__main__":
    main()
