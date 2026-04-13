"""
Scale Option A to FILL 1215x2160.
Extract GSN logo with transparency mask, blend seamlessly to bottom-right.
"""

from PIL import Image, ImageDraw, ImageFilter
import numpy as np

WIDTH = 1215
HEIGHT = 2160

src_path = r'C:\Users\Kee\.gemini\antigravity\brain\286d6c2d-919f-406a-8840-3eaaaa100c49\telegram_bg_dark_premium_1775989101287.png'
out_path = r'C:\Users\Kee\.gemini\antigravity\brain\286d6c2d-919f-406a-8840-3eaaaa100c49\telegram_bg_final_1215x2160.png'

src = Image.open(src_path).convert('RGBA')

# --- Step 1: Extract logo with transparency ---
# Logo is in bottom-left corner of original (approx 180x180 area)
logo_crop = src.crop((0, src.height - 180, 180, src.height)).copy()
logo_arr = np.array(logo_crop)

# Create alpha mask: pixels brighter than dark bg are logo
# Dark bg is roughly (0-15, 0-15, 0-15)
brightness = np.max(logo_arr[:, :, :3], axis=2)  # max of RGB
alpha = np.zeros_like(brightness, dtype=np.uint8)
alpha[brightness > 25] = 255  # Logo pixels
# Smooth edges
alpha_img = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1))
alpha = np.array(alpha_img)

# Apply alpha to logo
logo_rgba = logo_arr.copy()
logo_rgba[:, :, 3] = alpha
logo_transparent = Image.fromarray(logo_rgba, 'RGBA')

# --- Step 2: Scale source to FILL canvas (cover mode, no mirror) ---
src_rgb = src.convert('RGB')
scale = max(WIDTH / src_rgb.width, HEIGHT / src_rgb.height)
new_w = int(src_rgb.width * scale)
new_h = int(src_rgb.height * scale)
src_scaled = src_rgb.resize((new_w, new_h), Image.LANCZOS)

# Center-crop to 1215x2160
left = (new_w - WIDTH) // 2
top = (new_h - HEIGHT) // 2
canvas = src_scaled.crop((left, top, left + WIDTH, top + HEIGHT)).copy()

# --- Step 3: Remove old logo from bottom-left ---
# Clone texture from a nearby area (shift right to get clean bg)
clone_src_x = 200  # Sample from 200px to the right (no logo there)
clone_w = 400
clone_h = 400
clone_y = HEIGHT - clone_h

# Get clean background patch from right of old logo position
if clone_src_x + clone_w <= WIDTH:
    clean_patch = canvas.crop((clone_src_x, clone_y, clone_src_x + clone_w, clone_y + clone_h))
    canvas.paste(clean_patch, (0, clone_y))

# --- Step 4: Place logo at bottom-right with proper blending ---
canvas_rgba = canvas.convert('RGBA')

# Scale logo
logo_target_w = int(180 * scale * 1.1)
logo_target_h = int(180 * scale * 1.1)
logo_placed = logo_transparent.resize((logo_target_w, logo_target_h), Image.LANCZOS)

# Position bottom-right with margin
logo_x = WIDTH - logo_target_w - 60  # 10px more left
logo_y = HEIGHT - logo_target_h - 70  # 20px more up

# Paste with alpha compositing (seamless blend)
canvas_rgba.paste(logo_placed, (logo_x, logo_y), logo_placed)

# --- Save ---
final = canvas_rgba.convert('RGB')
final.save(out_path, 'PNG', optimize=False)
print(f"Done: {final.size[0]}x{final.size[1]}")
print(f"Saved: {out_path}")
