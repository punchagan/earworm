import React, { useCallback, useEffect, useState } from "react";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import RepeatIcon from "@material-ui/icons/Repeat";
import RepeatOneIcon from "@material-ui/icons/RepeatOne";
import ShuffleIcon from "@material-ui/icons/Shuffle";
import Plyr from "plyr";

import {
  AppStore,
  findSongIndex,
  setCurrentSong,
  setPlaying,
  setRepeatIndex,
} from "./app-store.mjs";

const Player = () => {
  // Player Setup
  const plyrRef = useCallback((node) => {
    if (node !== null) {
      const controls = ["current-time", "progress", "duration", "volume"];
      const plyr = new Plyr(node, { controls });
      plyrRef.current = plyr;
    }
  }, []);

  const playing = AppStore.useState((s) => s.playing);
  const togglePlaying = () => setPlaying(!playing);
  useEffect(() => {
    const player = plyrRef.current;
    playing ? player.play() : player.pause();
  }, [playing]);

  const currentSong = AppStore.useState((s) => s.currentSong);
  useEffect(() => {
    // Set Player Source
    const source = {
      title: currentSong?.title,
      type: "audio",
      sources: [{ src: currentSong?.src, type: "audio/mp3" }],
    };
    const player = plyrRef.current;
    player.source = source;
    playing ? player.play() : player.pause();
  }, [currentSong?.src]);

  // Shuffle State
  const shuffle = AppStore.useState((s) => s.shuffle);
  const toggleShuffle = () => {
    AppStore.update((s) => {
      s.shuffle = !s.shuffle;
    });
  };

  // Repeat State
  const repeatStates = ["Off", "Song", "All"];
  const repeatIndex = AppStore.useState((s) => s.repeatIndex);
  const cycleRepeat = () => {
    const n = repeatStates.length;
    const newIndex = (repeatIndex + 1) % n;
    setRepeatIndex(newIndex);
  };

  const repeatTitles = ["off", "one", "all"];
  const repeatClass = repeatIndex > 0 ? "btn-on" : "";
  const repeatIcons = [
    <RepeatIcon className={repeatClass} />,
    <RepeatOneIcon className={repeatClass} />,
    <RepeatIcon className={repeatClass} />,
  ];

  const shuffleIndex = Number(shuffle);
  const shuffleTitles = ["off", "on"];
  const shuffleClass = shuffle ? "btn-on" : "";

  const playIndex = Number(playing);
  const playIcons = [<PlayArrowIcon />, <PauseIcon />];
  const playTitles = ["Play", "Pause"];

  // NOTE: songEnded is used kind of like an event to mirror the plyr
  // songEnded event.  But, it is a state variable, which smells. This is to
  // avoid having stale values "closed" by the function attached as an event
  // listener on the player (for ended event).
  const [songEnded, setSongEnded] = useState(false);
  const setPlayingState = (e) => {
    if (!plyrRef.current.seeking) {
      setPlaying(e.type === "play");
      setSongEnded(false);
    }
  };
  const maybePlayNext = () => setSongEnded(true);
  const queue = AppStore.useState((s) => s.queue);
  const playNext = (backwards = false) => {
    const n = queue.length;
    const change = backwards ? -1 : 1;
    const songIndex = findSongIndex(queue, currentSong?.src);
    const nextIndex = (songIndex + change + n) % n;
    setCurrentSong(queue[nextIndex]);
    setPlaying(true);
  };

  useEffect(() => {
    const player = plyrRef.current;
    player.on("play", setPlayingState);
    player.on("pause", setPlayingState);
    player.on("ended", maybePlayNext);
  }, []);

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

  // FIXME: Ugly hack to hide newly created audio element
  const hideStyle = { display: "none" };

  return (
    <div className="player">
      <div className="plyr--audio ">
        <div className="player-controls plyr__controls">
          <span
            className="plyr__controls__item plyr__control"
            title="Play Previous"
            onClick={() => playNext(true)}
          >
            <SkipPreviousIcon />
          </span>
          <span
            className="plyr__controls__item plyr__control"
            title={playTitles[playIndex]}
            onClick={togglePlaying}
          >
            {playIcons[playIndex]}
          </span>
          <span
            className="plyr__controls__item plyr__control"
            title="Play Next"
            onClick={() => playNext()}
          >
            <SkipNextIcon />
          </span>
          <span
            className="plyr__controls__item plyr__control"
            title={`Repeating ${repeatTitles[repeatIndex]}`}
            onClick={cycleRepeat}
          >
            {repeatIcons[repeatIndex]}
          </span>
          <span
            className="plyr__controls__item plyr__control"
            title={`Shuffling ${shuffleTitles[shuffleIndex]}`}
            onClick={toggleShuffle}
          >
            <ShuffleIcon className={shuffleClass} />
          </span>
        </div>
      </div>
      <audio ref={plyrRef} id="player" style={hideStyle}></audio>
    </div>
  );
};

export default Player;
