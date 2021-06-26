import requests_mock

from earworm.metadata import download_file, is_url


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
