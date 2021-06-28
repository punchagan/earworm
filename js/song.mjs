import React, { useState } from "react";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import copy from "copy-to-clipboard";

// Icons
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import ReportProblemIcon from "@material-ui/icons/ReportProblem";
import IconButton from "@material-ui/core/IconButton";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import FileCopyIcon from "@material-ui/icons/FileCopy";

import { AppStore } from "./app-store.mjs";
import { Popover } from "./popover.mjs";

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

const ActionMenu = ({ metadataLink, hash }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const hidePopover = () => {
    setCopied(false);
  };

  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    let url = new URL(document.location);
    url.hash = hash;
    copy(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    handleClose();
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
        <MenuItem onClick={copyLink}>
          <FileCopyIcon /> Copy Link
        </MenuItem>
        {Boolean(metadataLink) && (
          <a
            title="Fix metadata"
            href={metadataLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <MenuItem>
              <ReportProblemIcon />
              Fix metadata
            </MenuItem>
          </a>
        )}
      </Menu>
      <Popover open={copied} onClose={hidePopover} text="Link copied to clipboard" />
    </div>
  );
};

const Song = ({ song, songElement }) => {
  const playing = AppStore.useState((s) => s.playing);
  const currentSong = AppStore.useState((s) => s.currentSong);
  const elem = currentSong?.src === song.src ? songElement : undefined;
  const isCurrent = currentSong?.src === song.src;
  const extraClassLabel = isCurrent ? (playing ? "current playing" : "current") : "";

  const playPause = () => {
    if (song.src === currentSong?.src) {
      AppStore.update((s) => {
        s.playing = !s.playing;
      });
    } else if (song.src) {
      AppStore.update((s) => {
        s.playing = true;
        s.currentSong = song;
      });
    } else {
      console.log("No src set");
    }
  };

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
        <button className="play-button" onClick={playPause}>
          {playIcon}
        </button>
      </span>
      <span className="song-cover-art" style={{ backgroundImage: `url(${song.image})` }}></span>
      <span className="song-description">
        <span className="song-title"> {song.title} </span>
        <small className="song-album" dangerouslySetInnerHTML={{ __html: description }} />
      </span>
      <small className="song-duration">{duration}</small>
      <ActionMenu metadataLink={song.metadata_link} hash={song.src} />
    </li>
  );
};

export default Song;
