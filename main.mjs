import {
  h,
  Component,
  render,
} from "https://cdn.skypack.dev/pin/preact@v10.5.13-wi6UEiTTWqqBsSGgZ7I8/mode=imports,min/optimized/preact.js";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "https://cdn.skypack.dev/pin/preact@v10.5.13-wi6UEiTTWqqBsSGgZ7I8/mode=imports,min/optimized/preact/hooks.js";
import Plyr from "https://cdn.skypack.dev/pin/plyr@v3.6.8-UdIeSiyxM89uOBn4h5ie/mode=imports,min/optimized/plyr.js";
import htm from "https://cdn.skypack.dev/pin/htm@v3.0.4-XTYwGtlZuRXP2GLXT2TZ/mode=imports,min/optimized/htm.js";

const html = htm.bind(h);

const Song = ({ song, isCurrent, playing, playPause, elem }) => {
  const extraClassLabel = isCurrent ? (playing ? "current playing" : "current") : "";
  const onClick = () => playPause(song.src);
  const description = eval("`" + songDescription + "`");
  const metadataLink = song.metadata_link
    ? html`<a class="song-info-link" href="${song.metadata_link}" target="_blank">
        <span class="material-icons">report_problem</span>
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

const Player = ({ plyrRef, repeatIndex, cycleRepeat }) => {
  const repeatIcons = ["repeat", "repeat_one_on", "repeat_on"];
  // FIXME: Ugly hack to hide newly created audio element
  const hideStyle = { display: "none" };
  return html`
    <div class="player">
      <span class="repeat-control" onClick=${cycleRepeat}>
        <span class="material-icons">${repeatIcons[repeatIndex]}</span>
      </span>
      <audio ref=${plyrRef} id="player" style=${hideStyle}></audio>
    </div>
  `;
};

const App = ({ library }) => {
  // Player Setup
  const plyrRef = useCallback((node) => {
    if (node !== null) {
      const plyr = new Plyr(node, {
        controls: ["play", "progress", "current-time", "duration"],
      });
      plyrRef.current = plyr;
    }
  }, []);

  // Current Song State
  const selectedSong = decodeURI(location.hash.substring(1)) || library?.[0]?.src;
  const [currentSong, setCurrentSong] = useState(selectedSong);
  const songElement = useRef();

  // Player State
  const [playing, setPlaying] = useState(false);

  // Toggle Play/Pause State. Can change both playing and curentSong
  const playPause = (src) => {
    if (src === currentSong) {
      setPlaying(!playing);
    } else if (src) {
      setCurrentSong(src);
      setPlaying(true);
    } else {
      console.log("No src set");
    }
  };

  // Repeat State
  const repeatStates = ["Off", "Song", "All"];
  const [repeatIndex, setRepeatIndex] = useState(2);
  const cycleRepeat = () => {
    const n = repeatStates.length;
    const newIndex = (repeatIndex + 1) % n;
    setRepeatIndex(newIndex);
  };
  useEffect(() => {
    const player = plyrRef.current;
    if (player) {
      player.repeatIndex = repeatIndex;
    }
  }, [repeatIndex]);

  const showSong = (element) => {
    const rect = element.getBoundingClientRect();
    const inView =
      rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
    if (!inView) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const source = {
      title: currentSong,
      type: "audio",
      sources: [{ src: currentSong, type: "audio/mp3" }],
    };
    const player = plyrRef.current;
    player.source = source;
    // If already playing, continue to play
    playing ? player.play() : player.pause();
    location.hash = currentSong;
    songElement.current && showSong(songElement.current);
  }, [currentSong]);

  useEffect(() => {
    const player = plyrRef.current;
    playing ? player.play() : player.pause();
  }, [playing]);

  const setPlayingState = (e) => {
    if (!plyrRef.current.seeking) {
      setPlaying(e.type === "play");
    }
  };

  const maybePlayNext = useCallback(() => {
    const {
      repeatIndex,
      config: { title: currentSrc },
    } = plyrRef.current;

    if (repeatIndex === 1) {
      setPlaying(true);
    } else if (repeatIndex === 2) {
      const n = library.length;
      const songIndex = library.findIndex((it) => it.src === currentSrc);
      const nextIndex = (songIndex + 1) % n;
      setCurrentSong(library[nextIndex].src);
      setPlaying(true);
    } else {
      console.log(`Repeat state is ${repeatIndex}`);
    }
  }, [repeatIndex]);

  useEffect(() => {
    const player = plyrRef.current;
    player.on("play", setPlayingState);
    player.on("pause", setPlayingState);
    player.on("ended", maybePlayNext);
  }, []);

  const playlist = library.map(
    (s) =>
      html`<${Song}
        song=${s}
        elem=${currentSong === s.src ? songElement : undefined}
        isCurrent=${currentSong === s.src}
        playPause=${playPause}
        playing=${playing}
      />`
  );

  const description = eval("html`" + pageDescription + "`");

  return html`<div>
    <${Player} plyrRef=${plyrRef} cycleRepeat=${cycleRepeat} repeatIndex=${repeatIndex} />
    <div id="container">
      <p>${description}</p>
      <ul class="songlist">
        ${playlist}
      </ul>
      <small
        >This page was generated using ${" "}
        <a href="https://github.com/punchagan/earworm" target="_blank">earworm</a>
      </small>
    </div>
  </div>`;
};

render(html`<${App} library=${songs} />`, document.querySelector("#app"));
