import { h } from "https://cdn.skypack.dev/pin/preact@v10.5.13-wi6UEiTTWqqBsSGgZ7I8/mode=imports,min/optimized/preact.js";
import htm from "https://cdn.skypack.dev/pin/htm@v3.0.4-XTYwGtlZuRXP2GLXT2TZ/mode=imports,min/optimized/htm.js";

const html = htm.bind(h);

// From https://stackoverflow.com/a/41015840
String.prototype.interpolate = function (params) {
  const names = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...names, `return \`${this}\`;`)(...vals);
};

const getDurationFormatted = (duration) => {
  const minutes = String(Math.floor(duration / 60)).padStart(2, "0");
  const seconds = String(duration % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const Song = ({ song, isCurrent, playing, playPause, elem }) => {
  const extraClassLabel = isCurrent ? (playing ? "current playing" : "current") : "";
  const onClick = () => playPause(song.src);
  const description = songDescription.interpolate({ song: song });
  const metadataLink = song.metadata_link
    ? html`<a class="song-info-link" href="${song.metadata_link}" target="_blank">
        <span title="Edit song info" class="material-icons">rule</span>
      </a>`
    : undefined;
  const playIcon = playing
    ? isCurrent
      ? "pause"
      : "play_arrow"
    : isCurrent
    ? "not_started"
    : "play_arrow";
  const duration = getDurationFormatted(song.duration);
  return html`<li ref=${elem} class="song ${extraClassLabel}" key=${song.src}>
    <span class="song-controls">
      <button class="play-button" onClick=${onClick}>
        <span class="material-icons">${playIcon}</span>
      </button>
    </span>
    <span class="song-cover-art" style="background-image: url(${song.image});"></span>
    <span class="song-description">
      <span class="song-title"> ${song.title} </span>
      <small class="song-album" dangerouslySetInnerHTML=${{ __html: description }} />
    </span>
    <small class="song-duration"> ${duration}</small>
    ${metadataLink}
  </li>`;
};

export default Song;
