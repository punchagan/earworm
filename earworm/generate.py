#!/usr/bin/env python
import argparse
import io
import os
import shutil
from dataclasses import fields
from typing import Dict, List
from urllib.parse import urljoin

import jinja2
import webassets  # type: ignore
import yaml
from PIL import Image  # type: ignore
from webassets.ext.jinja2 import AssetsExtension  # type: ignore

from .feed import generate_feed
from .metadata import Config, create_or_update_metadata_csv, download_file, get_metadata, is_url

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_FILE = "template.html"


def read_config(config_path: str) -> Config:
    with open(config_path) as f:
        config = yaml.load(f, Loader=yaml.FullLoader)

    config_dir = os.path.dirname(config_path)
    config["_config_dir"] = config_dir
    config["_config_path"] = config_path

    music_dir = config["music_dir"]
    config["music_dir"] = (
        None if music_dir is None else os.path.join(config_dir, os.path.expanduser(music_dir))
    )

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

    # Ensure base_url always ends with /
    base_url = config.get("base_url", "")
    if base_url and not base_url.endswith("/"):
        config["base_url"] = f"{base_url}/"

    return Config(**config)


def generate_index(config: Config, songs: List[Dict]) -> str:
    static_dir = os.path.join(HERE, "static")
    output_dir = os.path.join(config.out_dir, "static")
    assets_env = webassets.Environment(directory=output_dir, url="./static", load_path=[static_dir])
    all_js = webassets.Bundle("bundle.js", output="bundle.js")
    all_css = webassets.Bundle("main.css", output="bundle.css")
    assets_env.register("all_js", all_js)
    assets_env.register("all_css", all_css)

    loader = jinja2.FileSystemLoader(searchpath=HERE)
    env = jinja2.Environment(loader=loader, extensions=[AssetsExtension])
    env.assets_environment = assets_env  # type: ignore

    template = env.get_template(TEMPLATE_FILE)
    output = template.render(
        config=config,
        songs=songs,
        title=config.title,
        base_url=config.base_url,
        description=config.description,
        feed_url=urljoin(config.base_url, "index.xml") if config.generate_feed else None,
    )
    with open(os.path.join(config.out_dir, "index.html"), "w") as f:
        f.write(output)
    return f.name


def copy_media(config: Config, songs: List[Dict]) -> None:
    music_dir = os.path.join(config.out_dir, config.media_dir)
    os.makedirs(music_dir, exist_ok=True)
    for song in songs:
        shutil.copyfile(song["path"], os.path.join(config.out_dir, song["src"]))


def create_covers(config: Config, songs: List[Dict]) -> List[str]:
    """Create cover images for albums in the song list.

    NOTE: When image is a binary blob of data in the song, we assume albums
    have a single cover image. FIXME: This could potentially be fixed, later?

    """
    covers_dir = os.path.join(config.out_dir, "covers")
    os.makedirs(covers_dir, exist_ok=True)
    cover_images = []
    for song in songs:
        image = song.get("image")
        if not image:
            continue

        if isinstance(image, bytes):
            image_path = os.path.join(covers_dir, f'{song["album_slug"]}.jpg')
            song["image"] = os.path.relpath(image_path, start=config.out_dir)
            if os.path.exists(image_path):
                continue
            img = resize_image(image)
            img.save(image_path, quality=95, optimize=True)

        elif not is_url(image):
            raise NotImplementedError

        else:
            image_path = image

        cover_images.append(image_path)
    return cover_images


def resize_image(data: bytes, size: tuple = (300, 300)) -> Image:
    img = Image.open(io.BytesIO(data))
    w, h = img.size
    l = max(w, h)
    if l <= 300:
        return img
    square = Image.new(img.mode, (l, l), (0, 0, 0))
    paste_coords = ((h - w) // 2, 0) if h > w else (0, (w - h) // 2)
    square.paste(img, paste_coords)
    return square.resize(size)


def create_og_image(config: Config, path: str) -> None:
    image_dir = os.path.dirname(path)
    og_path = os.path.join(image_dir, "og-image.jpg")
    shutil.copyfile(path, og_path)


def create_favicon(config: Config, path: str) -> None:
    favicon_path = os.path.join(config.out_dir, "favicon.ico")
    with open(path, "rb") as f:
        data = f.read()
    img = resize_image(data, size=(96, 96))
    img.save(favicon_path, quality=95, optimize=True)


def generate_site(config: Config) -> None:
    print(f"Generating site from {config.music_dir or config._config_path} ...")
    songs = get_metadata(config)

    os.makedirs(config.out_dir, exist_ok=True)

    if config.music_dir:
        copy_media(config, songs)
    cover_images = create_covers(config, songs)
    first_image = cover_images and cover_images[0]
    if config.base_url and first_image and not is_url(first_image):
        create_og_image(config, first_image)
        create_favicon(config, first_image)
    if config.generate_feed:
        generate_feed(config, songs)
    index_path = generate_index(config, songs)
    print(f"Site generated in {index_path}!")


def yaml_represent_config(dumper: yaml.dumper.Dumper, config: Config) -> yaml.nodes.MappingNode:
    """Custom YAML dump representation for Config.

    NOTE: We could've simply used dataclasses.asdict to convert the config
    object to a dict, and dumped that data, but PyYAML seems to always sort the
    dictionaries by the keys when serializing them. This custom implementation
    overcomes that issue.

    """

    data = []
    for field in fields(config):
        name = field.name
        if name.startswith("_"):
            continue
        key = dumper.represent_data(name)
        value = dumper.represent_data(getattr(config, name))
        data.append((key, value))
    return yaml.nodes.MappingNode("tag:yaml.org,2002:map", data)


def make_config_file(config: Config) -> None:
    yaml.add_representer(Config, yaml_represent_config)
    with open(config._config_path, "w") as f:
        yaml.dump(config, f)
    print(f"Created config file at {config._config_path}")
    print("Please update the value of music_dir to your directory of files.")


def main() -> None:
    parser = argparse.ArgumentParser()
    # NOTE: Added here for running without any sub-command. But, the
    # sub-commands themselves add this option, again to be able to pass this
    # argument after the sub-command name
    parser.add_argument("-c", "--config", action="store", default="config.yml")
    parser.set_defaults(func=generate_site)

    subparsers = parser.add_subparsers(title="sub-commands")
    parser_update_csv = subparsers.add_parser(
        "update-csv", help="Update CSV from files in the music dir"
    )
    parser_update_csv.add_argument("-c", "--config", action="store", default="config.yml")
    parser_update_csv.set_defaults(func=create_or_update_metadata_csv)

    parser_make_config = subparsers.add_parser("make-config", help="Make a sample config file")
    parser_make_config.add_argument("-c", "--config", action="store", default="config.yml")
    parser_make_config.set_defaults(func=make_config_file)

    options = parser.parse_args()
    config_path = os.path.abspath(options.config)
    try:
        if options.func.__name__ == "make_config_file":
            config = Config(music_dir="/tmp", _config_path=config_path)
        else:
            config = read_config(config_path)
    except FileNotFoundError:
        print(f"Could not find the config file {options.config}.")
        print("Run `earworm make-config' to create the config file")
    else:
        options.func(config)


if __name__ == "__main__":
    main()
