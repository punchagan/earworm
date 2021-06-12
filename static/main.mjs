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

import Player from "./player.mjs";
import Song from "./song.mjs";

const html = htm.bind(h);

const App = ({ library }) => {
  // Setup Queue
  const [queue, setQueue] = useState([...library]);

  // Player Setup
  const plyrRef = useCallback((node) => {
    if (node !== null) {
      const controls = ["current-time", "progress", "duration", "volume"];
      const plyr = new Plyr(node, { controls });
      plyrRef.current = plyr;
    }
  }, []);

  const findSongIndex = (songList, src) => songList.findIndex((it) => it.src === src);

  // Current Song State
  const hash = decodeURI(location.hash.substring(1));
  const validHash = findSongIndex(library, hash) > -1;
  const selectedSong = validHash ? hash : queue?.[0]?.src;
  const [currentSong, setCurrentSong] = useState(selectedSong);
  const songElement = useRef();

  // Player State
  const [playing, setPlaying] = useState(validHash);
  const togglePlaying = () => {
    setPlaying(!playing);
  };

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

  // Shuffle State
  const [shuffle, setShuffle] = useState(false);
  const toggleShuffle = () => setShuffle(!shuffle);
  useEffect(() => {
    // NOTE: Simple implementation of shuffle, assuming the queue contains
    // the full library. This needs to change when we have a way to
    // add/remove from the queue and to see actual queue.
    const q = [...library];
    if (shuffle) {
      for (let i = 0; i < 12; i++) {
        q.sort(() => Math.random() - 0.5);
      }
    }
    setQueue(q);
  }, [shuffle]);

  // Repeat State
  const repeatStates = ["Off", "Song", "All"];
  const [repeatIndex, setRepeatIndex] = useState(validHash ? 0 : 2);
  const cycleRepeat = () => {
    const n = repeatStates.length;
    const newIndex = (repeatIndex + 1) % n;
    setRepeatIndex(newIndex);
  };

  const showSong = (element) => {
    const rect = element.getBoundingClientRect();
    const inView =
      rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
    if (!inView) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const song = library[findSongIndex(library, currentSong)];
    const source = {
      title: song.title,
      type: "audio",
      sources: [{ src: currentSong, type: "audio/mp3" }],
    };
    const player = plyrRef.current;
    player.source = source;
    playing ? player.play() : player.pause();
    location.hash = currentSong;
    songElement.current && showSong(songElement.current);
    document.title = `${song.title} — ${song.artist} — ${pageTitle}`;
  }, [currentSong]);

  useEffect(() => {
    const player = plyrRef.current;
    playing ? player.play() : player.pause();
  }, [playing]);

  const setPlayingState = (e) => {
    if (!plyrRef.current.seeking) {
      setPlaying(e.type === "play");
      setSongEnded(false);
    }
  };

  const playNext = (backwards = false) => {
    const n = queue.length;
    const change = backwards ? -1 : 1;
    const songIndex = findSongIndex(queue, currentSong);
    const nextIndex = (songIndex + change + n) % n;
    setCurrentSong(queue[nextIndex].src);
    setPlaying(true);
  };

  // NOTE: songEnded is used kind of like an event to mirror the plyr
  // songEnded event.  But, it is a state variable, which smells. This is to
  // avoid having stale values "closed" by the function attached as an event
  // listener on the player (for ended event).
  const [songEnded, setSongEnded] = useState(false);
  const chooseNext = useEffect(() => {
    if (!songEnded) {
      return;
    }
    console.log("Choosing next song...");
    if (repeatIndex === 1) {
      setPlaying(true);
    } else if (repeatIndex === 2) {
      playNext();
    } else {
      console.log(`Repeat state is ${repeatIndex}`);
    }
  }, [songEnded]);
  const maybePlayNext = () => setSongEnded(true);

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
    <${Player}
      plyrRef=${plyrRef}
      cycleRepeat=${cycleRepeat}
      repeatIndex=${repeatIndex}
      shuffle=${shuffle}
      toggleShuffle=${toggleShuffle}
      playing=${playing}
      togglePlaying=${togglePlaying}
      playNext=${playNext}
    />
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
