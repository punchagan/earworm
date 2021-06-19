import React, { useState, useEffect, useRef, useCallback } from "react";
import { render } from "react-dom";

import Header from "./header.mjs";
import Playlist from "./playlist.mjs";
import Player from "./player.mjs";
import {
  AppStore,
  findSongIndex,
  setCurrentSong,
  setPlaying,
  setQueue,
  setRepeatIndex,
} from "./app-store.mjs";

const showSong = (element) => {
  const rect = element.getBoundingClientRect();
  const inView =
    rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
  if (!inView) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const App = ({ library }) => {
  // Setup Queue
  const queue = AppStore.useState((s) => s.queue);
  useEffect(() => {
    setQueue(library);
  }, []);

  // Update state if valid hash in URL
  const hash = decodeURI(location.hash.substring(1));
  const songIndex = findSongIndex(library, hash);
  useEffect(() => {
    if (songIndex > -1) {
      const song = library[songIndex];
      setCurrentSong(song);
      setPlaying(true);
      setRepeatIndex(0);
    }
  }, []);

  // Set page props based on current song
  const currentSong = AppStore.useState((s) => s.currentSong);
  const songElement = useRef();
  useEffect(() => {
    if (!currentSong) {
      return;
    }
    location.hash = currentSong.src;
    songElement.current && showSong(songElement.current);
    document.title = `${currentSong.title} — ${currentSong.artist} — ${pageTitle}`;
  }, [currentSong?.src]);

  return (
    <div>
      <Player />
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
