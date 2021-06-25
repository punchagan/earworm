# earworm
Create a simple web page to listen to audio files in a directory

## Setup

The package is available on PyPI and you can install it using pip/conda.

```sh
pip install earworm
```
## Usage

This tool can generate a simple HTML page from a directory of music files. The
tool can read metadata from files directly (currently only supports MP3 files
and ID3 tags). But, if you have files which are not MP3, you can use a CSV file
with the metadata.

The CSV file **must** have the following columns `filename` and `title`, and
any additional ones you may want. A template can be generated using the tool --
see step 3 below.

1. To get started create a copy of the example config file:


   ```sh
   cp config.yml.example config.yml
   ```

1. Change the value of `music_dir` to the directory where you have your music
   files. If you wish to use a CSV file for the metadata, add a `metadata_csv`
   entry to the config.

   ```yaml
   metadata_csv: "/path/to/metadata.csv"
   ```

1. You can generate a template for the `metadata.csv` from your `music_dir` by
   running `earworm` with the `--update-csv` flag. Once the CSV file is
   generated, add a `metadata_csv` entry pointing to this file to your config.

1. Run `earworm` to generate a directory called `output` with an
   `index.html`, `music/` directory with all the music files that have "valid
   metadata", and a `covers/` directory with the cover images for the albums.

2. You can specify the `<title>` of the page by using the `title` config var

3. If the `base_url` parameter is specified, an `og:image` tag is added to the
   page, using the latest song's cover image.

2. Open the `index.html` in your browser to view the playlist locally.

4. If you have access to a webserver, you can just sync the output directory to
   your webserver. You can modify `deploy.sh` for your purposes, if you like.

5. If you don't have access to a webserver you can use something like [Google
   Drive](https://web.archive.org/web/20201127203126/https://www.ampercent.com/host-static-websites-google-driv/11070/)
   or
   [Dropbox](https://web.archive.org/web/20210117032036/https://www.ampercent.com/host-static-website-dropbox-free-webhosting/6426/)
   to host this as a static website.

## Dev Setup

When working on the source (py/html/CSS/JS) of the site, you can automatically
generate the html each time you make any changes to the input files using
`entr`.

```sh
ls /path/to/config $(git ls-files) | entr earworm --config /path/to/config-file
```

### JS toolchain

To change the JS files, you need to have `rollup` installed and you can run the
rollup watcher (`rollup -w -c rollup.config.js`) to build the `bundle.js`.
