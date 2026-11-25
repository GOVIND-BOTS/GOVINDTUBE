import unittest

from app.routes.videos import _parse_range


class ByteRangeTests(unittest.TestCase):
    def test_closed_range(self):
        self.assertEqual(_parse_range("bytes=10-19", 100), (10, 19))

    def test_open_ended_range(self):
        self.assertEqual(_parse_range("bytes=90-", 100), (90, 99))

    def test_suffix_range(self):
        self.assertEqual(_parse_range("bytes=-10", 100), (90, 99))

    def test_end_is_clamped(self):
        self.assertEqual(_parse_range("bytes=95-500", 100), (95, 99))

    def test_invalid_range_returns_416(self):
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as raised:
            _parse_range("bytes=100-120", 100)
        self.assertEqual(raised.exception.status_code, 416)


if __name__ == "__main__":
    unittest.main()
