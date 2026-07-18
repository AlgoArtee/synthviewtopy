"""Prepare a staged YouTopy placeholder/replacement asset for Unreal.

Usage:
  blender --background --python prepare_youtopy_asset.py -- \
    --input Cerebrum.glb --output Cerebrum_UE.glb \
    --asset-id academic-building-ashcroft-grand-library

The source browser GLB uses ten metres per unit. The default conversion scales
it by ten in Blender metres, creates LOD1/HLOD/collision meshes, preserves the
stable ID as custom metadata, and exports a self-contained GLB for Interchange.
"""

import argparse
import os
import sys

import bpy


def parse_args():
    raw = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input")
    parser.add_argument("--output", required=True)
    parser.add_argument("--asset-id", required=True)
    parser.add_argument("--no-web-scale", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    return parser.parse_args(raw)


def slug(value):
    return "_".join(part for part in "".join(c if c.isalnum() else " " for c in value).split())


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection.name != "Collection":
            bpy.data.collections.remove(collection)


def import_source(path, self_test):
    reset_scene()
    if self_test:
        bpy.ops.mesh.primitive_cube_add(size=2)
        bpy.context.object.name = "SelfTestSource"
        return
    if not path or not os.path.isfile(path):
        raise RuntimeError("--input must point to an existing GLB/GLTF or use --self-test")
    extension = os.path.splitext(path)[1].lower()
    if extension not in (".glb", ".gltf"):
        raise RuntimeError("The staged pipeline accepts GLB/GLTF input")
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(path))


def ensure_collection(name):
    collection = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if collection.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(collection)
    return collection


def move_to_collection(obj, collection):
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)


def apply_decimate(obj, ratio):
    if len(obj.data.polygons) < 12:
        return
    modifier = obj.modifiers.new(name="YouTopy Decimate", type="DECIMATE")
    modifier.ratio = ratio
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def prepare(args):
    import_source(args.input, args.self_test)
    asset = slug(args.asset_id)
    render_collection = ensure_collection("YT_RENDER")
    collision_collection = ensure_collection("YT_COLLISION")
    hlod_collection = ensure_collection("YT_HLOD")
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("The input contains no mesh objects")

    for index, obj in enumerate(meshes):
        obj["yt_stable_id"] = args.asset_id
        obj["yt_authority"] = "unreal-editor"
        obj["yt_source_disposition"] = "bootstrap-placeholder-only"
        if not args.no_web_scale:
            obj.scale = tuple(component * 10.0 for component in obj.scale)
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        obj.select_set(False)
        obj.name = f"SM_{asset}_{index:02d}_LOD0"
        move_to_collection(obj, render_collection)

        lod1 = obj.copy()
        lod1.data = obj.data.copy()
        lod1.name = f"SM_{asset}_{index:02d}_LOD1"
        render_collection.objects.link(lod1)
        apply_decimate(lod1, 0.5)

        hlod = obj.copy()
        hlod.data = obj.data.copy()
        hlod.name = f"SM_{asset}_{index:02d}_HLOD"
        hlod_collection.objects.link(hlod)
        apply_decimate(hlod, 0.18)

        collision = obj.copy()
        collision.data = obj.data.copy()
        collision.name = f"UCX_SM_{asset}_{index:02d}_00"
        collision_collection.objects.link(collision)
        bpy.context.view_layer.objects.active = collision
        collision.select_set(True)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.convex_hull()
        bpy.ops.object.mode_set(mode="OBJECT")
        collision.select_set(False)

    output = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_extras=True,
        export_materials="EXPORT",
    )
    print(f"YT_ASSET_READY {args.asset_id} meshes={len(meshes)} output={output}")


if __name__ == "__main__":
    prepare(parse_args())
