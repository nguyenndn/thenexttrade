# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec for TNT Connect v3 (PyWebView)
Build: pyinstaller build.spec --clean --noconfirm
"""
import os

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('web', 'web'),  # Bundle web assets (HTML/CSS/JS)
    ],
    hiddenimports=[
        'pystray._win32',
        'PIL._tkinter_finder',
        'webview',
        'webview.platforms.edgechromium',
        'clr_loader',
        'pythonnet',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib', 'scipy', 'pandas',
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='TNTConnect',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,       # No console window in production
    icon=None,
    version=None,
    windowed=True,
)
