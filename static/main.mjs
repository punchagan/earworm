import React, { useState, useEffect, useRef, useCallback } from "react";
import { render } from "react-dom";
import Plyr from "plyr";

import Header from "./header.mjs";
import Playlist from "./playlist.mjs";
import Player from "./player.mjs";
import { AppStore } from "./app-store.mjs";

const showSong = (element) => {
  const rect = element.getBoundingClientRect();
  const inView =
    rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
  if (!inView) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const findSongIndex = (songList, src) => songList.findIndex((it) => it.src === src);

const App = ({ library }) => {
  // Setup Queue
  const queue = AppStore.useState((s) => s.queue);
  const setQueue = (q) => {
    AppStore.update((s) => {
      s.queue = q;
    });
  };
  useEffect(() => {
    setQueue(library);
  }, []);

  // Player Setup
  const plyrRef = useCallback((node) => {
    if (node !== null) {
      const controls = ["current-time", "progress", "duration", "volume"];
      const plyr = new Plyr(node, { controls });
      plyrRef.current = plyr;
    }
  }, []);

  // Current Song State
  const songElement = useRef();
  const currentSong = AppStore.useState((s) => s.currentSong);
  const setCurrentSong = (song) =>
    AppStore.update((s) => {
      s.currentSong = song;
    });

  // Player State
  const playing = AppStore.useState((s) => s.playing);
  const setPlaying = (playing) =>
    AppStore.update((s) => {
      s.playing = playing;
    });

  // Repeat State
  const repeatIndex = AppStore.useState((s) => s.repeatIndex);
  const setRepeatIndex = (idx) => {
    AppStore.update((s) => {
      s.repeatIndex = idx;
    });
  };

  // Update state if valid hash in URL
  const hash = decodeURI(location.hash.substring(1));
  const validHash = findSongIndex(library, hash) > -1;
  useEffect(() => {
    if (validHash) {
      const song = library[findSongIndex(library, hash)];
      setCurrentSong(song);
      setPlaying(true);
      setRepeatIndex(0);
    }
  }, []);

  useEffect(() => {
    if (!currentSong) {
      return;
    }

    // Set Player Source
    const source = {
      title: currentSong.title,
      type: "audio",
      sources: [{ src: currentSong.src, type: "audio/mp3" }],
    };
    const player = plyrRef.current;
    player.source = source;
    playing ? player.play() : player.pause();

    // Update page properties
    location.hash = currentSong.src;
    songElement.current && showSong(songElement.current);
    document.title = `${currentSong.title} — ${currentSong.artist} — ${pageTitle}`;
  }, [currentSong?.src]);

  const setPlayingState = (e) => {
    if (!plyrRef.current.seeking) {
      setPlaying(e.type === "play");
      setSongEnded(false);
    }
  };

  const playNext = (backwards = false) => {
    const n = queue.length;
    const change = backwards ? -1 : 1;
    const songIndex = findSongIndex(queue, currentSong?.src);
    const nextIndex = (songIndex + change + n) % n;
    setCurrentSong(queue[nextIndex]);
    setPlaying(true);
  };

  // NOTE: songEnded is used kind of like an event to mirror the plyr
  // songEnded event.  But, it is a state variable, which smells. This is to
  // avoid having stale values "closed" by the function attached as an event
  // listener on the player (for ended event).
  const [songEnded, setSongEnded] = useState(false);
  const maybePlayNext = () => setSongEnded(true);
  useEffect(() => {
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

  useEffect(() => {
    const player = plyrRef.current;
    player.on("play", setPlayingState);
    player.on("pause", setPlayingState);
    player.on("ended", maybePlayNext);
  }, []);

  return (
    <div>
      <Player plyrRef={plyrRef} playNext={playNext} />
      <div id="container">
        <Header description={pageDescription} title={pageTitle} queue={queue} />
        <Playlist library={library} songElement={songElement} />
        <small>
          This page was generated using ${" "}
          <a href="https://github.com/punchagan/earworm" rel="noopener noreferrer" target="_blank">
            earworm
          </a>
        </small>
      </div>
    </div>
  );
};

render(<App library={songs} />, document.querySelector("#app"));
