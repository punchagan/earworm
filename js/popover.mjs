import React from "react";
import P from "@material-ui/core/Popover";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  popoverText: {
    padding: theme.spacing(2),
    margin: 0,
    background: "var(--plyr-color-main)",
    color: "white",
  },
}));

export const Popover = ({ text, open, onClose }) => {
  const classes = useStyles();
  return (
    <P
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: window.innerHeight - 80, left: window.innerWidth / 2 }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
    >
      <p className={classes.popoverText}>{text}</p>
    </P>
  );
};
