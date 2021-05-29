#!/usr/bin/env python
import csv
from dataclasses import dataclass
import datetime
import glob
import io
import json
import os
import re
import shutil
import subprocess
from urllib import parse

import dateutil.parser
import jinja2
from PIL import Image
import requests
from tinytag import TinyTag
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_FILE = "template.html"


class Config:
    def __init__(self, **config):
        self.__dict__.update(**config)


@dataclass
class Row:
    filename: str
    title: str
    date: str = None
    duration: str = None
    album: str = None
    artist: str = None
    composer: str = None
    lyricist: str = None
    instrument: str = None


def is_url(text):
    return bool(parse.urlparse(text).scheme)


def download_file(url, download_dir):
    with requests.get(url, stream=True) as r:
        header = r.headers["Content-Disposition"]
        name = re.search('filename="(.*)"', header).group(1)
        filename = os.path.join(download_dir, name)
        print(f"Downloading {name} ...")
        r.raise_for_status()
        with open(filename, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return filename


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


def get_metadata(config):
    if config.metadata_csv:
        songs = get_metadata_from_csv(config)
    else:
        songs = get_metadata_from_music_dir(config)
    return songs


def get_metadata_from_csv(config):
    music_dir = config.music_dir
    csv_path = config.metadata_csv
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        reader.fieldnames = [f.lower() for f in reader.fieldnames]
        # FIXME: Validate all required columns are present
        metadata = {os.path.join(config.music_dir, row["filename"]): Row(**row) for row in reader}
    songs = []

    for path, tags in metadata.items():
        if not os.path.exists(path):
            continue
        if config.title_required and not tags.title:
            continue
        elif config.album_required and not tags.album:
            continue
        elif config.date_required and not tags.date:
            continue

        duration = int(float(tags.duration or 0))
        mins, secs = duration // 60, duration % 60
        album_slug = tags.album.lower().replace(" ", "-") if tags.album else ""
        song = {
            "path": path,
            "src": tags.filename,
            "title": tags.title or tags.filename,
            "album": tags.album,
            "creation_time": datetime.datetime.strptime(tags.date, "%Y-%m-%d")
            if tags.date
            else datetime.datetime.now(),
            "duration": f"{mins}:{secs:02d}",
            "image": None,
            "album_slug": album_slug,
        }
        songs.append(song)

    n = len(songs)
    print(f"Found {n} songs ...")
    return sorted(songs, key=lambda s: s["creation_time"], reverse=True)


def get_metadata_from_music_dir(config):
    music_dir = config.music_dir
    paths = glob.glob(f"{music_dir}/**/*.mp3", recursive=True)
    metadata = {path: TinyTag.get(path, image=True) for path in paths}
    songs = []
    date_re = re.compile(config.date_regex)
    for path, tags in metadata.items():
        if config.title_required and not tags.title:
            continue
        elif config.album_required and tags.album is None:
            continue

        src = os.path.basename(path)
        match = date_re.search(path)
        date = {key: int(value) for key, value in match.groupdict().items()} if match else None
        if config.date_required and not date:
            continue

        duration = int(tags.duration)
        mins, secs = duration // 60, duration % 60
        album_slug = tags.album.lower().replace(" ", "-") if tags.album else ""
        song = {
            "path": path,
            "src": src,
            "title": tags.title or src,
            "album": tags.album,
            "creation_time": datetime.datetime(**date) if date else datetime.datetime.now(),
            "duration": f"{mins}:{secs:02d}",
            "image": tags.get_image(),
            "album_slug": album_slug,
        }
        songs.append(song)
        if not tags.title:
            print("NOTE: No title for", path)
        if not tags.album:
            print("NOTE: No album for", path)

    n = len(songs)
    print(f"Found {n} songs ...")

    return sorted(songs, key=lambda s: s["creation_time"], reverse=True)


def generate_index(songs, config):
    loader = jinja2.FileSystemLoader(searchpath=HERE)
    env = jinja2.Environment(loader=loader)
    template = env.get_template(TEMPLATE_FILE)
    metadata = [{"src": f'music/{s["src"]}', "title": s["title"]} for s in songs]
    output = template.render(
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
        shutil.copyfile(song["path"], os.path.join(music_dir, song["src"]))


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
