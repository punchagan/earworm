import React from "react";

import { AppStore } from "./app-store.mjs";
import Song from "./song.mjs";

const Playlist = ({ library, playPause, currentSong, songElement }) => {
  const playing = AppStore.useState((s) => s.playing);
  return (
    <ul className="songlist">
      {library.map((s) => (
        <Song
          song={s}
          elem={currentSong === s.src ? songElement : undefined}
          isCurrent={currentSong === s.src}
          playPause={playPause}
        />
      ))}
    </ul>
  );
};

export default Playlist;
