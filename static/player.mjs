import React from "react";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import RepeatIcon from "@material-ui/icons/Repeat";
import RepeatOneIcon from "@material-ui/icons/RepeatOne";
import ShuffleIcon from "@material-ui/icons/Shuffle";

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
