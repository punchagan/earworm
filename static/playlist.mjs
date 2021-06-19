import React from "react";

import Song from "./song.mjs";

const Playlist = ({ library, playing, playPause, currentSong, songElement }) => {
  return (
    <ul className="songlist">
      {library.map((s) => (
        <Song
          song={s}
          elem={currentSong === s.src ? songElement : undefined}
          isCurrent={currentSong === s.src}
          playPause={playPause}
          playing={playing}
        />
      ))}
    </ul>
  );
};

export default Playlist;
