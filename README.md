# earworm
A simple html/js/CSS page to play music from a local directory

## Setup

Install the requirements specified in requirements.txt

```sh
pip install requirements.txt
```

## Usage

1. Run `./generate.py /path/to/dir/containing/music` to generate a
   directory called `out` with an `index.html`, `music/` directory
   with all the music files that have a non-empty album ID3 tag, and a
   `covers/` directory with the cover images for the albums.

2. You can specify the `<title>` of the page by using the `--title`
   option on `generate.py`. When no `--title` is specified, the folder
   name of the music directory is used as the title.

2. Open the `index.html` in your browser to view the playlist locally.

3. Modify and use the `deploy.sh` script to push the entire `out/`
   directory to a server from where the page is served.

## Dev Setup

When working on the source (py/html/CSS/JS) of the site, you can
automatically generate the html each time you make any changes to the
input files using `entr`.

```sh
ls  *.{py,html,css,js} | entr ./generate.py /path/to/music/dir/
```
