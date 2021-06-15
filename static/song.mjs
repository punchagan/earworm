import React from "react";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import ReportProblemIcon from "@material-ui/icons/ReportProblem";
import IconButton from "@material-ui/core/IconButton";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

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

const ActionMenu = ({ metadataLink }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>

      <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={open} onClose={handleClose}>
        <a title="Fix metadata" href={metadataLink} target="_blank" rel="noopener noreferrer">
          <MenuItem disabled={!Boolean(metadataLink)}>
            <ReportProblemIcon />
            Fix metadata
          </MenuItem>
        </a>
      </Menu>
    </div>
  );
};

const Song = ({ song, isCurrent, playing, playPause, elem }) => {
  const extraClassLabel = isCurrent ? (playing ? "current playing" : "current") : "";
  const onClick = () => playPause(song.src);
  const description = songDescription.interpolate({ song: song });
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
      <ActionMenu metadataLink={song.metadata_link} />
    </li>
  );
};

export default Song;
