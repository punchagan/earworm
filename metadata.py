import csv
import datetime
from dataclasses import dataclass, fields
import glob
import io
import json
import os
import re
import subprocess
from urllib import parse

import requests
from tinytag import TinyTag, TinyTagException


@dataclass
class Row:
    filename: str
    title: str = None
    album: str = None
    artist: str = None
    composer: str = None
    lyricist: str = None
    instrument: str = None
    date: str = None
    duration: str = None


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


def read_metadata_csv(config):
    with open(config.metadata_csv) as f:
        reader = csv.DictReader(f)
        reader.fieldnames = [f.lower() for f in reader.fieldnames]
        # FIXME: Validate all required columns are present
        return [row for row in reader]


def get_metadata_from_csv(config):
    music_dir = config.music_dir
    rows = read_metadata_csv(config)
    metadata = {os.path.join(config.music_dir, row["filename"]): Row(**row) for row in rows}
    return metadata_to_song_list(metadata, config)


def ffprobe_metadata(path):
    command = [
        "ffprobe",
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        path,
    ]
    try:
        output = json.loads(subprocess.check_output(command))
    except FileNotFoundError as e:
        fn = e.filename
        print(f"Install {fn} to get duration, other metatdata for non-mp3 files.")
        output = {"format": {"filename": os.path.basename(path)}}

    return output["format"]


def get_metadata_from_music_dir(config, song_list=True):
    music_dir = config.music_dir
    paths = glob.glob(f"{music_dir}/**/*", recursive=True)
    metadata = {}
    row_keys = {f.name for f in fields(Row)}
    for path in paths:
        try:
            metadata[path] = TinyTag.get(path, image=True)
        except TinyTagException as e:
            pass

        if path not in metadata or not metadata[path].duration:
            md = ffprobe_metadata(path) if config.use_ffprobe else {"filename": path}
            md = {key: value for key, value in md.items() if key in row_keys}
            metadata[path] = Row(**md)

    date_re = re.compile(config.date_regex)
    for path, tags in metadata.items():
        match = date_re.search(path)
        tags.date = "{year}-{month}-{day}".format(**match.groupdict()) if match else None

    return metadata_to_song_list(metadata, config) if song_list else metadata


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
            "filename": src,
            "title": tags.title or src,
            "artist": tags.artist,
            "album": tags.album,
            "date": tags.date or "",
            "duration": f"{mins}:{secs:02d}",
            "image": tags.get_image() if isinstance(tags, TinyTag) else None,
            "album_slug": album_slug,
        }
        songs.append(song)

    n = len(songs)
    print(f"Found {n} songs ...")
    return sorted(songs, key=lambda s: s["date"], reverse=True)


def create_or_update_metadata_csv(config):
    if not config.metadata_csv:
        config.metadata_csv = os.path.join(config.config_dir, "metadata.csv")

    if os.path.exists(config.metadata_csv):
        rows = {r["filename"]: r for r in read_metadata_csv(config)}

    else:
        rows = {}

    file_metadata = get_metadata_from_music_dir(config, song_list=False)
    for path, metadata in file_metadata.items():
        filename = os.path.basename(path)
        if filename in rows:
            old_metadata = rows[filename]
            for key, value in old_metadata.items():
                new_value = metadata.__dict__.get(key)
                if not value and new_value:
                    old_metadata[key] = new_value
        else:
            metadata = {key: value for key, value in metadata.__dict__.items() if hasattr(Row, key)}
            metadata["filename"] = filename
            rows[filename] = metadata

    fieldnames = [f.name for f in fields(Row)]
    with open(config.metadata_csv, "w") as f:
        writer = csv.DictWriter(f, fieldnames)
        writer.writeheader()
        for name, row in rows.items():
            writer.writerow(row)

    print(f"Wrote updated CSV to {f.name}")
