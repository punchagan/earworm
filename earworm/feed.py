import datetime
import os
from typing import List, Dict, Optional
from urllib.parse import urljoin
import warnings

from dateutil import parser, tz
from feedgen.feed import FeedGenerator  # type: ignore
from jinja2 import Template

from .metadata import Config

DESCRIPTION_TEMPLATE = Template(
    """
{% if song.image %}
  <img src="{{song.image}}" />
{% endif %}

{% if song.artist %}
  <p>Artist: {{song.artist}}</p>
{% endif %}

{% if song.album %}
  <p>Album: {{song.album}}</p>
{% endif %}

{% if song.date %}
  <p>Date: {{song.date}}</p>
{% endif %}
    """
)


def entry_date(date: str) -> Optional[datetime.datetime]:
    try:
        parsed_date = parser.parse(date)
    except parser.ParserError:
        warnings.warn("feed: Could not parse date string")
        return None

    if not parsed_date.tzinfo:
        warnings.warn("feed: No Timezone info found on song dates for feed generation; using UTC")
        tzlocal = tz.tzoffset("UTC", 0)
        parsed_date = parsed_date.replace(tzinfo=tzlocal)

    return parsed_date


def generate_feed(config: Config, songs: List[Dict]) -> None:
    assert config.base_url, "Base URL is required to generate a feed!"
    feed_name = "index.xml"
    base_url = config.base_url
    fg = FeedGenerator()
    fg.load_extension("podcast")
    fg.id(base_url)
    fg.title(config.title)
    fg.subtitle(config.description)
    fg.link(href=base_url, rel="alternate")
    artists = {s["artist"] for s in songs if s.get("artist")}
    fg.author([{"name": artist} for artist in artists])
    fg.logo(f"{base_url}/favicon.ico")
    fg.link(href=urljoin(base_url, feed_name), rel="self")
    fg.language("en")

    for song in songs[::-1]:
        fe = fg.add_entry()
        song_url = urljoin(base_url, song["src"])
        fe.id(song_url)
        fe.title(song["title"])
        fe.description(DESCRIPTION_TEMPLATE.render(song=song).strip())
        fe.link(href=urljoin(base_url, f'#{song["src"]}'))
        fe.enclosure(song_url, song["filesize"], "audio/mpeg")
        fe.published(entry_date(song["date"]))

    fg.rss_file(os.path.join(config.out_dir, feed_name))
