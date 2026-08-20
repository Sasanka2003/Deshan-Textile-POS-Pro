import ctypes
from ctypes import wintypes

PRINTER_NAME = "XP-58C"

winspool = ctypes.WinDLL("winspool.drv")

class DOC_INFO_1(ctypes.Structure):
    _fields_ = [
        ("pDocName", wintypes.LPWSTR),
        ("pOutputFile", wintypes.LPWSTR),
        ("pDatatype", wintypes.LPWSTR),
    ]

OpenPrinter = winspool.OpenPrinterW
OpenPrinter.argtypes = [
    wintypes.LPWSTR,
    ctypes.POINTER(wintypes.HANDLE),
    wintypes.LPVOID,
]
OpenPrinter.restype = wintypes.BOOL

ClosePrinter = winspool.ClosePrinter
StartDocPrinter = winspool.StartDocPrinterW
EndDocPrinter = winspool.EndDocPrinter
StartPagePrinter = winspool.StartPagePrinter
EndPagePrinter = winspool.EndPagePrinter
WritePrinter = winspool.WritePrinter

def raw_print(data):
    handle = wintypes.HANDLE()

    if not OpenPrinter(PRINTER_NAME, ctypes.byref(handle), None):
        raise OSError("Cannot open printer")

    try:
        info = DOC_INFO_1(
            "XP-58C CALIBRATION",
            None,
            "RAW"
        )

        if not StartDocPrinter(
            handle,
            1,
            ctypes.cast(ctypes.byref(info), wintypes.LPVOID)
        ):
            raise OSError("StartDocPrinter failed")

        try:
            StartPagePrinter(handle)

            buf = ctypes.create_string_buffer(data)
            written = wintypes.DWORD()

            if not WritePrinter(
                handle,
                buf,
                len(data),
                ctypes.byref(written)
            ):
                raise OSError("WritePrinter failed")

            EndPagePrinter(handle)

        finally:
            EndDocPrinter(handle)

    finally:
        ClosePrinter(handle)


ESC = b"\x1b"
GS  = b"\x1d"

data = bytearray()

# Initialize printer
data += ESC + b"@"

# Standard font / normal size
data += ESC + b"!" + b"\x00"

# Left alignment
data += ESC + b"a" + b"\x00"

# Set left margin = 0 dots
data += GS + b"L" + b"\x00\x00"

# Set printable width = 384 dots
# 384 = 0x0180 -> nL=0x80, nH=0x01
data += GS + b"W" + b"\x80\x01"

data += b"XP-58C PRINT AREA CALIBRATION\n"
data += b"==========================================\n"
data += b"|1234567890123456789012345678901234567890|\n"
data += b"|L                                      R|\n"
data += b"|----------------------------------------|\n"
data += b"|XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX|\n"
data += b"|----------------------------------------|\n"
data += b"01  05  10  15  20  25  30  35  40\n"
data += b"==========================================\n"

# Center test
data += ESC + b"a" + b"\x01"
data += b"CENTER TEST\n"
data += b"[        DESHAN TEXTILE        ]\n"

# Right test
data += ESC + b"a" + b"\x02"
data += b"RIGHT EDGE TEST >>\n"

# Back to left
data += ESC + b"a" + b"\x00"
data += b"<< LEFT EDGE TEST\n"

data += b"\n"

# Feed before cutter
data += ESC + b"d" + b"\x02"

# Full cut
data += GS + b"V" + b"\x00"

raw_print(bytes(data))

print("Calibration receipt printed successfully.")
