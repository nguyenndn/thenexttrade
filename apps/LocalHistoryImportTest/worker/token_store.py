from __future__ import annotations

import ctypes
from ctypes import wintypes
from pathlib import Path


class DATA_BLOB(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_byte))]


crypt32 = ctypes.WinDLL("crypt32", use_last_error=True)
kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

crypt32.CryptProtectData.argtypes = [
    ctypes.POINTER(DATA_BLOB),
    wintypes.LPCWSTR,
    ctypes.POINTER(DATA_BLOB),
    ctypes.c_void_p,
    ctypes.c_void_p,
    wintypes.DWORD,
    ctypes.POINTER(DATA_BLOB),
]
crypt32.CryptProtectData.restype = wintypes.BOOL
crypt32.CryptUnprotectData.argtypes = [
    ctypes.POINTER(DATA_BLOB),
    ctypes.POINTER(wintypes.LPWSTR),
    ctypes.POINTER(DATA_BLOB),
    ctypes.c_void_p,
    ctypes.c_void_p,
    wintypes.DWORD,
    ctypes.POINTER(DATA_BLOB),
]
crypt32.CryptUnprotectData.restype = wintypes.BOOL
kernel32.LocalFree.argtypes = [ctypes.c_void_p]
kernel32.LocalFree.restype = ctypes.c_void_p

CRYPTPROTECT_UI_FORBIDDEN = 0x1


def _blob(data: bytes) -> tuple[DATA_BLOB, ctypes.Array]:
    buffer = ctypes.create_string_buffer(data)
    return DATA_BLOB(len(data), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_byte))), buffer


def protect(data: bytes) -> bytes:
    source, source_buffer = _blob(data)
    destination = DATA_BLOB()
    if not crypt32.CryptProtectData(
        ctypes.byref(source), "GSN Worker Token", None, None, None, CRYPTPROTECT_UI_FORBIDDEN, ctypes.byref(destination)
    ):
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        return ctypes.string_at(destination.pbData, destination.cbData)
    finally:
        kernel32.LocalFree(destination.pbData)
        del source_buffer


def unprotect(data: bytes) -> bytes:
    source, source_buffer = _blob(data)
    destination = DATA_BLOB()
    description = wintypes.LPWSTR()
    if not crypt32.CryptUnprotectData(
        ctypes.byref(source), ctypes.byref(description), None, None, None, CRYPTPROTECT_UI_FORBIDDEN, ctypes.byref(destination)
    ):
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        return ctypes.string_at(destination.pbData, destination.cbData)
    finally:
        if description:
            kernel32.LocalFree(description)
        kernel32.LocalFree(destination.pbData)
        del source_buffer


def save_token(path: Path, token: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(protect(token.encode("utf-8")))
    temporary.replace(path)


def load_token(path: Path) -> str:
    return unprotect(path.read_bytes()).decode("utf-8")
