import requests_mock

from earworm.metadata import download_file, google_sheet_cell_link, is_url


def test_is_url():
    assert is_url("https://google.com")
    assert not is_url("google.com")
    assert not is_url("foo")


def test_dowload_file(tmpdir):
    # Google sheets CSV file
    example_url = "https://docs.google.com/spreadsheets/d/abcdef/export?format=csv&id=abcdef&gid=0"
    text = "Student Name,Gender,Class,Score"
    filename = "ExampleSpreadsheet-ClassData.csv"
    headers = {"Content-Disposition": f'filename="{filename}"'}

    with requests_mock.Mocker() as m:
        m.get(example_url, text=text, headers=headers)
        download_filename = download_file(example_url, tmpdir)
    assert download_filename.endswith(filename)

    with open(download_filename) as f:
        download_text = f.read()
    assert download_text == text

    # Random CSV file
    example_url = "https://raw.githubusercontent.com/data/school.csv"
    filename = "metadata.csv"
    with requests_mock.Mocker() as m:
        m.get(example_url, text=text, headers={})
        download_filename = download_file(example_url, tmpdir)
    assert download_filename.endswith(filename)

    with open(download_filename) as f:
        download_text = f.read()
    assert download_text == text


def test_google_sheet_cell_link():
    example_url = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms&gid=0"
    url = google_sheet_cell_link(example_url, 10)
    assert "range=A10" in url
