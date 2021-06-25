import csv
from dataclasses import dataclass, field, fields
import glob
import io
import json
import os
import re
import subprocess
from typing import Dict, List, Optional, Union
from urllib import parse

import requests
from tinytag import TinyTag, TinyTagException

UNSUPPORTED_FORMATS = (".amr",)  # Not played by FF or Chrome. See issue #10


@dataclass
class Config:
    music_dir: str
    metadata_csv: str = ""
    title_required: bool = False
    album_required: bool = False
    date_required: bool = False
    date_regex: str = r"(?P<year>\d{4})_(?P<month>\d{2})_(?P<day>\d{2})"
    ignored_dates: set = field(default_factory=set)
    out_dir: str = "./public"
    title: str = "My Music"
    song_description: str = "${song.album} (${song.date})"
    description: str = "<small>Welcome to my music page.</small>"
    base_url: str = ""
    use_ffprobe: bool = True
    _config_dir: str = ""
    _metadata_url: str = ""


@dataclass
class Row:
    filename: str
    title: str = ""
    album: str = ""
    artist: str = ""
    composer: str = ""
    lyricist: str = ""
    instrument: str = ""
    date: str = ""
    duration: str = ""


def is_url(text: str) -> bool:
    return bool(parse.urlparse(text).scheme)


def google_sheet_cell_link(url: str, row_num: int, column: str = "A") -> Optional[str]:
    parsed_url = parse.urlparse(url)
    if not (bool(parsed_url.scheme) and parsed_url.netloc == "docs.google.com"):
        return None
    qs = parse.parse_qs(parsed_url.query)
    if not ("id" in qs and "gid" in qs):
        return None

    url = "https://docs.google.com/spreadsheets/d/{id[0]}/edit#gid={gid[0]}&range={column}{row_num}"
    return url.format(row_num=row_num, column=column, **qs)


def download_file(url: str, download_dir: str) -> str:
    with requests.get(url, stream=True) as r:
        header = r.headers["Content-Disposition"]
        match = re.search('filename="(.*)"', header)
        name = match.group(1) if match else "metadata.csv"
        filename = os.path.join(download_dir, name)
        print(f"Downloading {name} ...")
        r.raise_for_status()
        with open(filename, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return filename


def get_metadata(config: Config) -> List[Dict]:
    if config.metadata_csv:
        songs = get_song_list_from_csv(config)
    else:
        songs = get_song_list_from_music_dir(config)

    excluded_songs = {song["path"] for song in songs if song["path"].endswith(UNSUPPORTED_FORMATS)}
    filtered_songs = [song for song in songs if song["path"] not in excluded_songs]
    if excluded_songs:
        print("\n\033[91mWARNING: The following files have unsupported formats:\n    ", end="")
        print("\n    ".join(excluded_songs))
        print("\033[00m")
    return songs


def read_metadata_csv(config: Config) -> List[Dict]:
    with open(config.metadata_csv) as f:
        reader = csv.DictReader(f)
        reader.fieldnames = [f.lower() for f in reader.fieldnames] if reader.fieldnames else None
        return [row for row in reader]


def get_song_list_from_csv(config: Config) -> List[Dict]:
    music_dir = config.music_dir
    rows = read_metadata_csv(config)
    metadata = {os.path.join(config.music_dir, row["filename"]): Row(**row) for row in rows}
    return metadata_to_song_list(metadata, config)


def ffprobe_metadata(path: str) -> Dict:
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
    except subprocess.CalledProcessError:
        output = {}

    return output.get("format")


def get_metadata_from_music_dir(config, song_list: bool = True) -> Dict[str, Union[Row, TinyTag]]:
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
            if not md:
                continue
            md = {key: value for key, value in md.items() if key in row_keys}
            metadata[path] = Row(**md)

    date_re = re.compile(config.date_regex)
    for path, tags in metadata.items():
        match = date_re.search(path)
        date = "{year}-{month}-{day}".format(**match.groupdict()) if match else ""
        tags.date = date if date not in config.ignored_dates else None

    return metadata


def get_song_list_from_music_dir(config: Config) -> List[Dict]:
    metadata = get_metadata_from_music_dir(config)
    return metadata_to_song_list(metadata, config)


def metadata_to_song_list(metadata: Dict[str, Row], config: Config) -> List[Dict]:
    songs = []

    for num_row, (path, tags) in enumerate(metadata.items(), start=2):
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
        album_slug = tags.album.lower().replace(" ", "-") if tags.album else ""
        metadata_link = google_sheet_cell_link(config._metadata_url, num_row)
        song = {
            "path": path,
            "filename": src,
            "title": tags.title or src,
            "artist": tags.artist,
            "album": tags.album,
            "date": tags.date or "",
            "duration": duration,
            "image": tags.get_image() if isinstance(tags, TinyTag) else None,
            "album_slug": album_slug,
            "metadata_link": metadata_link,
        }
        songs.append(song)

    n = len(songs)
    print(f"Found {n} songs ...")
    return sorted(songs, key=lambda s: s["date"], reverse=True)


def create_or_update_metadata_csv(config: Config) -> None:
    if not config.metadata_csv:
        config.metadata_csv = os.path.join(config._config_dir, "metadata.csv")

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
            new_metadata = {
                key: value for key, value in metadata.__dict__.items() if hasattr(Row, key)
            }
            new_metadata["filename"] = filename
            rows[filename] = new_metadata

    fieldnames = [f.name for f in fields(Row)]
    with open(config.metadata_csv, "w") as f:
        writer = csv.DictWriter(f, fieldnames)
        writer.writeheader()
        for name, row in rows.items():
            writer.writerow(row)

    print(f"Wrote updated CSV to {f.name}")
