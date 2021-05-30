import csv
import datetime
from dataclasses import dataclass
import glob
import os
import re
from urllib import parse

import requests
from tinytag import TinyTag


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
    return metadata_to_song_list(metadata, config)


def get_metadata_from_music_dir(config):
    music_dir = config.music_dir
    paths = glob.glob(f"{music_dir}/**/*.mp3", recursive=True)
    metadata = {path: TinyTag.get(path, image=True) for path in paths}
    date_re = re.compile(config.date_regex)
    for path, tags in metadata.items():
        match = date_re.search(path)
        tags.date = "{year}-{month}-{day}".format(**match.groupdict()) if match else None

    return metadata_to_song_list(metadata, config)


def metadata_to_song_list(metadata, config):
    songs = []

    for path, tags in metadata.items():
        src = os.path.basename(path)

        if not os.path.exists(path):
            continue
        elif config.title_required and not tags.title:
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
            "src": src,
            "title": tags.title or src,
            "artist": tags.artist,
            "album": tags.album,
            # FIXME: Avoid multiple back and forth conversions
            "creation_time": datetime.datetime.strptime(tags.date, "%Y-%m-%d")
            if tags.date
            else datetime.datetime.now(),
            "duration": f"{mins}:{secs:02d}",
            "image": tags.get_image() if isinstance(tags, TinyTag) else None,
            "album_slug": album_slug,
        }
        songs.append(song)

    n = len(songs)
    print(f"Found {n} songs ...")
    return sorted(songs, key=lambda s: s["creation_time"], reverse=True)
