import React from "react";

import { AppStore } from "./app-store.mjs";
import Song from "./song.mjs";

const Playlist = ({ library, songElement }) => {
  return (
    <ul className="songlist">
      {library.map((s) => (
        <Song song={s} songElement={songElement} />
      ))}
    </ul>
  );
};

export default Playlist;
