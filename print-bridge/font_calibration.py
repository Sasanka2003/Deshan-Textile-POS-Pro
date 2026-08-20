import sys
sys.path.insert(0, r".\print-bridge")

from deshan_pos_print_bridge import raw_print

ESC = b"\x1b"
GS  = b"\x1d"

data = bytearray()

data += ESC + b"@"

# ----- FONT A TEST -----
data += ESC + b"a" + b"\x00"
data += ESC + b"M" + b"\x00"
data += b"FONT A - NORMAL\n"
data += b"123456789012345678901234567890123456789012\n"
data += b"|----------------------------------------|\n"
data += b"\n"

# ----- FONT B TEST -----
data += ESC + b"M" + b"\x01"
data += b"FONT B - COMPACT\n"
data += b"123456789012345678901234567890123456789012\n"
data += b"|----------------------------------------|\n"
data += b"\n"

# ----- 48 CHARACTER TEST -----
data += b"48 COLUMN TEST\n"
data += b"123456789012345678901234567890123456789012345678\n"
data += b"|----------------------------------------------|\n"

# Feed + cut
data += ESC + b"d" + b"\x03"
data += GS + b"V" + b"\x00"

raw_print(bytes(data), "XP-58C FONT CALIBRATION")

print("FONT CALIBRATION PRINTED")
