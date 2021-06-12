import { h } from "https://cdn.skypack.dev/pin/preact@v10.5.13-wi6UEiTTWqqBsSGgZ7I8/mode=imports,min/optimized/preact.js";
import htm from "https://cdn.skypack.dev/pin/htm@v3.0.4-XTYwGtlZuRXP2GLXT2TZ/mode=imports,min/optimized/htm.js";

const html = htm.bind(h);

const Song = ({ song, isCurrent, playing, playPause, elem }) => {
  const extraClassLabel = isCurrent ? (playing ? "current playing" : "current") : "";
  const onClick = () => playPause(song.src);
  const description = eval("`" + songDescription + "`");
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
  return html`<li ref=${elem} class="song ${extraClassLabel}" key=${song.src}>
    <span class="song-controls">
      <button class="play-button" onClick=${onClick}>
        <span class="material-icons">${playIcon}</span>
      </button>
    </span>
    <span class="song-cover-art" style="background-image: url(${song.image});"></span>
    <span class="song-description">
      <span class="song-title"> ${song.title} </span>
      <small class="song-album"> ${description} </small>
    </span>
    <small class="song-duration"> ${song.duration}</small>
    ${metadataLink}
  </li>`;
};

export default Song;
