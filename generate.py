#!/usr/bin/env python
from dataclasses import dataclass
import datetime
import io
import json
import os
import shutil
import subprocess

import dateutil.parser
import jinja2
from PIL import Image
import yaml

from metadata import download_file, Row, is_url, get_metadata


HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_FILE = "template.html"


@dataclass
class Config:
    music_dir: str
    metadata_csv: str = ""
    title_required: bool = False
    album_required: bool = False
    date_required: bool = False
    date_regex: str = r"(?P<year>\d{4})_(?P<month>\d{2})_(?P<day>\d{2})"
    out_dir: str = "./public"
    title: str = "My Music"
    song_description: str = "{{song.album}} ({{song.creation_time}})"
    description: str = "<small>Welcome to my music page.</small>"
    base_url: str = ""


def read_config(config_path):
    with open(config_path) as f:
        config = yaml.load(f, Loader=yaml.FullLoader)

    config_dir = os.path.dirname(config_path)

    music_dir = config["music_dir"]
    config["music_dir"] = os.path.join(config_dir, os.path.expanduser(music_dir))

    metadata_csv = config.get("metadata_csv")
    if is_url(metadata_csv):
        metadata_csv = download_file(metadata_csv, config_dir)
    else:
        metadata_csv = (
            os.path.join(config_dir, os.path.expanduser(metadata_csv)) if metadata_csv else None
        )
    config["metadata_csv"] = metadata_csv

    out_dir = os.path.join(config_dir, config.get("out_dir", "output"))
    config["out_dir"] = out_dir

    return Config(**config)


def render_str_template(text, **data):
    template = jinja2.Environment(loader=jinja2.BaseLoader).from_string(text)
    return template.render(**data)


def generate_index(songs, config):
    loader = jinja2.FileSystemLoader(searchpath=HERE)
    env = jinja2.Environment(loader=loader)
    env.filters["render"] = render_str_template
    template = env.get_template(TEMPLATE_FILE)
    metadata = [{"src": f'music/{s["filename"]}', "title": s["title"]} for s in songs]
    output = template.render(
        config=config,
        songs=songs,
        metadata=json.dumps(metadata),
        title=config.title,
        base_url=config.base_url,
        description=config.description,
    )
    with open(os.path.join(config.out_dir, "index.html"), "w") as f:
        f.write(output)
    return f.name


def copy_media(songs):
    music_dir = os.path.join(config.out_dir, "music")
    os.makedirs(music_dir, exist_ok=True)
    for song in songs:
        shutil.copyfile(song["path"], os.path.join(music_dir, song["filename"]))


def create_covers(songs):
    covers_dir = os.path.join(config.out_dir, "covers")
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
    favicon_path = os.path.join(config.out_dir, "favicon.ico")
    with open(path, "rb") as f:
        data = f.read()
    img = resize_image(data, size=(96, 96))
    img.save(favicon_path, quality=95, optimize=True)


def generate_site(config):
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
    options = parser.parse_args()
    config = read_config(os.path.abspath(options.config))

    generate_site(config)
