#!/usr/bin/env python
import io
import json
import os
import shutil
from typing import List, Dict

import dateutil.parser
import jinja2
from PIL import Image
import yaml

from metadata import Config, create_or_update_metadata_csv, download_file, get_metadata, is_url


HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_FILE = "template.html"


def read_config(config_path: str) -> Config:
    with open(config_path) as f:
        config = yaml.load(f, Loader=yaml.FullLoader)

    config_dir = os.path.dirname(config_path)
    config["config_dir"] = config_dir

    music_dir = config["music_dir"]
    config["music_dir"] = os.path.join(config_dir, os.path.expanduser(music_dir))

    metadata_csv = config.get("metadata_csv")
    if is_url(metadata_csv):
        config["_metadata_url"] = metadata_csv
        metadata_csv = download_file(metadata_csv, config_dir)
    else:
        metadata_csv = (
            os.path.join(config_dir, os.path.expanduser(metadata_csv)) if metadata_csv else None
        )
    config["metadata_csv"] = metadata_csv

    out_dir = os.path.join(config_dir, config.get("out_dir", "output"))
    config["out_dir"] = out_dir

    return Config(**config)


def generate_index(songs: List[Dict], config: Config) -> str:
    loader = jinja2.FileSystemLoader(searchpath=HERE)
    env = jinja2.Environment(loader=loader)
    template = env.get_template(TEMPLATE_FILE)
    metadata = [dict(src=f'music/{s["filename"]}', **s) for s in songs]
    output = template.render(
        config=config,
        songs=songs,
        metadata=json.dumps(metadata, default=lambda o: None),
        title=config.title,
        base_url=config.base_url,
        description=config.description,
    )
    with open(os.path.join(config.out_dir, "index.html"), "w") as f:
        f.write(output)
    return f.name


def copy_media(songs: List[Dict]) -> None:
    music_dir = os.path.join(config.out_dir, "music")
    os.makedirs(music_dir, exist_ok=True)
    for song in songs:
        shutil.copyfile(song["path"], os.path.join(music_dir, song["filename"]))


def create_covers(songs: List[Dict]) -> List[str]:
    covers_dir = os.path.join(config.out_dir, "covers")
    os.makedirs(covers_dir, exist_ok=True)
    cover_images = []
    for song in songs:
        image = song.get("image")
        if image is None:
            continue
        # NOTE: We assume all the songs in an album to have the same
        # cover image.
        image_path = os.path.join(covers_dir, f'{song["album_slug"]}.jpg')
        song["image"] = os.path.relpath(image_path, start=config.out_dir)
        if os.path.exists(image_path):
            continue
        img = resize_image(image)
        img.save(image_path, quality=95, optimize=True)
        cover_images.append(image_path)
    return cover_images


def resize_image(data: bytes, size=(300, 300)) -> Image:
    img = Image.open(io.BytesIO(data))
    w, h = img.size
    l = max(w, h)
    if l <= 300:
        return img
    square = Image.new(img.mode, (l, l), (0, 0, 0))
    paste_coords = ((h - w) // 2, 0) if h > w else (0, (w - h) // 2)
    square.paste(img, paste_coords)
    return square.resize(size)


def create_og_image(path: str) -> None:
    image_dir = os.path.dirname(path)
    og_path = os.path.join(image_dir, "og-image.jpg")
    shutil.copyfile(path, og_path)


def create_favicon(path: str) -> None:
    favicon_path = os.path.join(config.out_dir, "favicon.ico")
    with open(path, "rb") as f:
        data = f.read()
    img = resize_image(data, size=(96, 96))
    img.save(favicon_path, quality=95, optimize=True)


def generate_site(config: Config) -> None:
    print(f"Generating site from {config.music_dir} ...")
    songs = get_metadata(config)

    os.makedirs(config.out_dir, exist_ok=True)

    copy_media(songs)
    cover_images = create_covers(songs)
    if cover_images and config.base_url:
        create_og_image(cover_images[0])
        create_favicon(cover_images[0])
    index_path = generate_index(songs, config)
    print(f"Site generated in {index_path}!")


if __name__ == "__main__":
    import argparse

    config_default = "config.yml"
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", action="store", default=config_default)
    parser.add_argument("--update-csv", action="store_true", default=False)

    options = parser.parse_args()
    config = read_config(os.path.abspath(options.config))
    if options.update_csv:
        create_or_update_metadata_csv(config)
    else:
        generate_site(config)
