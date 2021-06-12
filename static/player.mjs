import { h } from "https://cdn.skypack.dev/pin/preact@v10.5.13-wi6UEiTTWqqBsSGgZ7I8/mode=imports,min/optimized/preact.js";
import htm from "https://cdn.skypack.dev/pin/htm@v3.0.4-XTYwGtlZuRXP2GLXT2TZ/mode=imports,min/optimized/htm.js";

const html = htm.bind(h);

const Player = (props) => {
  const {
    plyrRef,
    repeatIndex,
    cycleRepeat,
    shuffle,
    toggleShuffle,
    playing,
    togglePlaying,
    playNext,
  } = props;
  const repeatIcons = ["repeat", "repeat_one", "repeat"];
  const repeatTitles = ["off", "one", "all"];
  const repeatClass = repeatIndex > 0 ? "btn-on" : "";

  const shuffleIndex = Number(shuffle);
  const shuffleTitles = ["off", "on"];
  const shuffleClass = shuffle ? "btn-on" : "";

  const playIndex = Number(playing);
  const playIcons = ["play_arrow", "pause"];
  const playTitles = ["Play", "Pause"];

  // FIXME: Ugly hack to hide newly created audio element
  const hideStyle = { display: "none" };

  return html`
    <div class="player">
      <div class="plyr--audio ">
        <div class="player-controls plyr__controls">
          <span
            class="plyr__controls__item plyr__control"
            title="Play Previous"
            onClick=${() => playNext(true)}
          >
            <span class="material-icons">skip_previous</span>
          </span>
          <span
            class="plyr__controls__item plyr__control"
            title=${playTitles[playIndex]}
            onClick=${togglePlaying}
          >
            <span class="material-icons">${playIcons[playIndex]}</span>
          </span>
          <span
            class="plyr__controls__item plyr__control"
            title="Play Next"
            onClick=${() => playNext()}
          >
            <span class="material-icons">skip_next</span>
          </span>
          <span
            class="plyr__controls__item plyr__control"
            title="Repeating ${repeatTitles[repeatIndex]}"
            onClick=${cycleRepeat}
          >
            <span class="material-icons ${repeatClass}">${repeatIcons[repeatIndex]}</span>
          </span>
          <span
            class="plyr__controls__item plyr__control"
            title="Shuffling ${shuffleTitles[shuffleIndex]}"
            onClick=${toggleShuffle}
          >
            <span class="material-icons ${shuffleClass}">shuffle</span>
          </span>
        </div>
      </div>
      <audio ref=${plyrRef} id="player" style=${hideStyle}></audio>
    </div>
  `;
};

export default Player;