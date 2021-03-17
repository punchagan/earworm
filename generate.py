#!/usr/bin/env python
import datetime
import glob
import json
import os
import shutil
import subprocess

import dateutil.parser
import jinja2
from tinytag import TinyTag

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, 'out')
TEMPLATE_FILE = "template.html"


def get_metadata(music_dir):
    paths = glob.glob(f'{music_dir}/**/*.mp3', recursive=True)
    metadata = {path: TinyTag.get(path) for path in paths}
    songs = []
    for path, tags in metadata.items():
        if tags.album is None:
            continue
        date = [int(x) for x in path.split('_', 1)[1].split('.', 1)[0].split('_')]
        song = {
            'path': path,
            'src': os.path.basename(path),
            'title': tags.title,
            'album': tags.album,
            'creation_time': datetime.datetime(*date)
        }
        songs.append(song)
        if not tags.title:
            print("NOTE: No title for", path)

    n = len(songs)
    print(f"Found {n} songs ...")

    return sorted(songs, key=lambda s: s['creation_time'], reverse=True)


def generate_index(songs, music_dir):
    loader = jinja2.FileSystemLoader(searchpath=HERE)
    env = jinja2.Environment(loader=loader)
    template = env.get_template(TEMPLATE_FILE)
    metadata = [{'src': f'music/{s["src"]}', 'title': s['title']} for s in songs]
    output = template.render(songs=songs, metadata=json.dumps(metadata))
    with open(os.path.join(OUT_DIR, 'index.html'), 'w') as f:
        f.write(output)


def copy_media(songs):
    music_dir = os.path.join(OUT_DIR, 'music')
    os.makedirs(music_dir, exist_ok=True)
    for song in songs:
        shutil.copyfile(song['path'], os.path.join(music_dir, song['src']))


def generate_site(music_dir):
    print(f"Generating site from {music_dir}")
    songs = get_metadata(music_dir)

    shutil.rmtree(OUT_DIR)
    os.makedirs(OUT_DIR, exist_ok=True)

    copy_media(songs)
    generate_index(songs, music_dir)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('path', action='store')

    options = parser.parse_args()
    music_dir = os.path.abspath(os.path.expanduser(options.path))

    generate_site(music_dir)
