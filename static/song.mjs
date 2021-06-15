import React from "react";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import ReportProblemIcon from "@material-ui/icons/ReportProblem";

// From https://stackoverflow.com/a/41015840
String.prototype.interpolate = function (params) {
  const names = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...names, `return \`${this}\`;`)(...vals);
};

const getDurationFormatted = (duration) => {
  const minutes = String(Math.floor(duration / 60)).padStart(2, "0");
  const seconds = String(duration % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const Song = ({ song, isCurrent, playing, playPause, elem }) => {
  const extraClassLabel = isCurrent ? (playing ? "current playing" : "current") : "";
  const onClick = () => playPause(song.src);
  const description = songDescription.interpolate({ song: song });
  const metadataLink = song.metadata_link ? (
    <a
      title="Edit song info"
      className="song-info-link"
      href="{song.metadata_link}"
      target="_blank"
    >
      <ReportProblemIcon />
    </a>
  ) : undefined;
  const playIcon = playing ? (
    isCurrent ? (
      <PauseIcon />
    ) : (
      <PlayArrowIcon />
    )
  ) : isCurrent ? (
    <PlayArrowIcon />
  ) : (
    <PlayArrowIcon />
  );
  const duration = getDurationFormatted(song.duration);
  return (
    <li ref={elem} className={`song ${extraClassLabel}`} key={song.src}>
      <span className="song-controls">
        <button className="play-button" onClick={onClick}>
          {playIcon}
        </button>
      </span>
      <span className="song-cover-art" style={{ backgroundImage: `url(${song.image})` }}></span>
      <span className="song-description">
        <span className="song-title"> {song.title} </span>
        <small className="song-album" dangerouslySetInnerHTML={{ __html: description }} />
      </span>
      <small className="song-duration">{duration}</small>
      {metadataLink}
    </li>
  );
};

export default Song;
