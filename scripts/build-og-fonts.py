"""Membuat ulang font untuk OG image.

Satori (mesin di balik next/og) tidak bisa memproses variable font Fraunces,
jadi kita potong satu instance statis pada setelan sumbu yang sama dengan yang
dipakai situs. Jalankan hanya kalau setelan tipografi di app/globals.css berubah.

    pip install fonttools
    python scripts/build-og-fonts.py
"""

import urllib.request
from pathlib import Path

from fontTools import ttLib
from fontTools.varLib import instancer

OUT = Path(__file__).resolve().parent.parent / "assets" / "fonts"
VARIABLE_URL = (
    "https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/"
    "Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf"
)
MONO_URL = (
    "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/"
    "IBMPlexMono-Regular.ttf"
)

# Harus sama dengan .font-display di app/globals.css dan berat heading di situs.
INSTANCE = {"wght": 300, "opsz": 144, "SOFT": 24, "WONK": 1}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    variable = OUT / "Fraunces-Variable.ttf"
    urllib.request.urlretrieve(VARIABLE_URL, variable)
    urllib.request.urlretrieve(MONO_URL, OUT / "IBMPlexMono-Regular.ttf")

    font = ttLib.TTFont(variable)
    instancer.instantiateVariableFont(font, INSTANCE, inplace=True)
    font.save(OUT / "Fraunces-Display.ttf")
    variable.unlink()

    print("assets/fonts diperbarui")


if __name__ == "__main__":
    main()
