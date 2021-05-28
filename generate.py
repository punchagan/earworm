#!/usr/bin/env python
import datetime
import glob
import io
import json
import os
import shutil
import subprocess

import dateutil.parser
import jinja2
from PIL import Image
from tinytag import TinyTag
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "out")
TEMPLATE_FILE = "template.html"


def get_metadata(music_dir):
    paths = glob.glob(f"{music_dir}/**/*.mp3", recursive=True)
    metadata = {path: TinyTag.get(path, image=True) for path in paths}
    songs = []
    for path, tags in metadata.items():
        if tags.album is None:
            continue
        src = os.path.basename(path)
        date = [int(x) for x in src.split("_", 1)[1].split(".", 1)[0].split("_")]
        duration = int(tags.duration)
        mins, secs = duration // 60, duration % 60
        album_slug = tags.album.lower().replace(" ", "-")
        song = {
            "path": path,
            "src": src,
            "title": tags.title,
            "album": tags.album,
            "creation_time": datetime.datetime(*date),
            "duration": f"{mins}:{secs:02d}",
            "image": tags.get_image(),
            "album_slug": album_slug,
        }
        songs.append(song)
        if not tags.title:
            print("NOTE: No title for", path)

    n = len(songs)
    print(f"Found {n} songs ...")

    return sorted(songs, key=lambda s: s["creation_time"], reverse=True)


def generate_index(songs, title, description, base_url):
    loader = jinja2.FileSystemLoader(searchpath=HERE)
    env = jinja2.Environment(loader=loader)
    template = env.get_template(TEMPLATE_FILE)
    metadata = [{"src": f'music/{s["src"]}', "title": s["title"]} for s in songs]
    output = template.render(
        songs=songs,
        metadata=json.dumps(metadata),
        title=title,
        base_url=base_url,
        description=description,
    )
    with open(os.path.join(OUT_DIR, "index.html"), "w") as f:
        f.write(output)


def copy_media(songs):
    music_dir = os.path.join(OUT_DIR, "music")
    os.makedirs(music_dir, exist_ok=True)
    for song in songs:
        shutil.copyfile(song["path"], os.path.join(music_dir, song["src"]))


def create_covers(songs):
    covers_dir = os.path.join(OUT_DIR, "covers")
    os.makedirs(covers_dir, exist_ok=True)
    cover_images = []
    for song in songs:
        if song["image"] is None:
            continue
        # NOTE: We assume all the songs in an album to have the same
        # cover image.
        image_path = os.path.join(covers_dir, f'{song["album_slug"]}.jpg')
        if os.path.exists(image_path):
            continue
        img = resize_image(song["image"])
        img.save(image_path, quality=95, optimize=True)
        cover_images.append(image_path)
    return cover_images


def resize_image(data, size=(300, 300)):
    img = Image.open(io.BytesIO(data))
    w, h = img.size
    l = max(w, h)
    if l <= 300:
        return img
    square = Image.new(img.mode, (l, l), (0, 0, 0))
    paste_coords = ((h - w) // 2, 0) if h > w else (0, (w - h) // 2)
    square.paste(img, paste_coords)
    return square.resize(size)


def create_og_image(path):
    image_dir = os.path.dirname(path)
    og_path = os.path.join(image_dir, "og-image.jpg")
    shutil.copyfile(path, og_path)


def create_favicon(path):
    favicon_path = os.path.join(OUT_DIR, "favicon.ico")
    with open(path, "rb") as f:
        data = f.read()
    img = resize_image(data, size=(96, 96))
    img.save(favicon_path, quality=95, optimize=True)


def generate_site(music_dir, title, description, base_url):
    print(f"Generating site from {music_dir} ...")
    songs = get_metadata(music_dir)

    shutil.rmtree(OUT_DIR)
    os.makedirs(OUT_DIR, exist_ok=True)

    copy_media(songs)
    cover_images = create_covers(songs)
    if cover_images and base_url:
        create_og_image(cover_images[0])
        create_favicon(cover_images[0])
    generate_index(songs, title, description, base_url)
    print(f"Site generated!")


def read_config(config_path):
    with open(config_path) as f:
        config = yaml.load(f, Loader=yaml.FullLoader)
    config["music_dir"] = os.path.realpath(os.path.expanduser(config["music_dir"]))
    return config


if __name__ == "__main__":
    import argparse

    config_default = os.path.join(HERE, "config.yml")
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", action="store", default=config_default)
    options = parser.parse_args()
    config = read_config(options.config)

    generate_site(**config)
