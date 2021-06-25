import React, { useEffect } from "react";

import { AppStore, setQueue } from "./app-store.mjs";
import Song from "./song.mjs";

const Playlist = ({ library, songElement }) => {
  // Shuffle state
  const shuffle = AppStore.useState((s) => s.shuffle);
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

  return (
    <ul className="songlist">
      {library.map((s) => (
        <Song song={s} songElement={songElement} />
      ))}
    </ul>
  );
};

export default Playlist;
