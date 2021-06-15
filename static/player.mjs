import React from "react";

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
  const repeatIcons = ["repeat", "repeat_one", "repeat"];
  const repeatTitles = ["off", "one", "all"];
  const repeatClass = repeatIndex > 0 ? "btn-on" : "";

  const shuffleIndex = Number(shuffle);
  const shuffleTitles = ["off", "on"];
  const shuffleClass = shuffle ? "btn-on" : "";

  const playIndex = Number(playing);
  const playIcons = ["play_arrow", "pause"];
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
            <span className="material-icons">skip_previous</span>
          </span>
          <span
            className="plyr__controls__item plyr__control"
            title={playTitles[playIndex]}
            onClick={togglePlaying}
          >
            <span className="material-icons">{playIcons[playIndex]}</span>
          </span>
          <span
            className="plyr__controls__item plyr__control"
            title="Play Next"
            onClick={() => playNext()}
          >
            <span className="material-icons">skip_next</span>
          </span>
          <span
            className="plyr__controls__item plyr__control"
            title={`Repeating ${repeatTitles[repeatIndex]}`}
            onClick={cycleRepeat}
          >
            <span className={`material-icons ${repeatClass}`}>{repeatIcons[repeatIndex]}</span>
          </span>
          <span
            className="plyr__controls__item plyr__control"
            title={`Shuffling ${shuffleTitles[shuffleIndex]}`}
            onClick={toggleShuffle}
          >
            <span className={`material-icons ${shuffleClass}`}>shuffle</span>
          </span>
        </div>
      </div>
      <audio ref={plyrRef} id="player" style={hideStyle}></audio>
    </div>
  );
};

export default Player;
