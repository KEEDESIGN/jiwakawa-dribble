from PIL import Image, ImageDraw, ImageFont
import os

width, height = 640, 360
img = Image.new("RGBA", (width, height), (30, 55, 153, 255))
draw = ImageDraw.Draw(img)

# 1. 背景空グラデーション (青空〜スタジアム)
for y in range(200):
    r = int(14 + (41 - 14) * (y / 200))
    g = int(25 + (128 - 25) * (y / 200))
    b = int(47 + (185 - 47) * (y / 200))
    draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

# スタジアムの照明・屋根
for x in range(20, width, 140):
    draw.rectangle([x, 30, x + 6, 160], fill=(26, 36, 44))
    draw.rectangle([x - 12, 20, x + 18, 30], fill=(241, 196, 15))
    draw.rectangle([x - 8, 22, x + 14, 28], fill=(255, 255, 255))

# 観客席ドット
colors = [(231, 76, 60), (52, 152, 219), (241, 196, 15), (46, 204, 113), (255, 255, 255)]
for row in range(4):
    for col in range(64):
        cx = col * 10
        cy = 150 + row * 12
        c = colors[(col * 3 + row * 7) % len(colors)]
        draw.rectangle([cx, cy, cx + 7, cy + 6], fill=c)

# 2. 芝生ピッチ
draw.rectangle([0, 200, width, height], fill=(39, 174, 96))
# 芝刈りストライプ
for x in range(0, width, 80):
    draw.rectangle([x, 200, x + 40, height], fill=(46, 204, 113))

# タッチライン白線
draw.rectangle([0, 310, width, 314], fill=(255, 255, 255))

# 3. ドット絵キャラクター描画 (ピクセルサイズ 6px)
matrix = [
    "    HHHHHH      ",
    "   HHHHHHHH     ",
    "   HSSSSSSH     ",
    "   HSEESEEH     ",
    "   HSSBBSSH     ",
    "   HSBBBBBH     ",
    "    HBBBBH      ",
    "   WKWWKWKW     ",
    "  WWKWLKWKWW    ",
    "  WWKWKKWKWW    ",
    "   WKWWKWKW     ",
    "   WKWWKWKW     ",
    "    PPPPPP      ",
    "   Pp    pP     ",
    "   SS     SS    ",
    "   SS      SS   ",
    "   WW       WW  ",
    "   CC        CC "
]

color_map = {
    'H': (38, 27, 22),
    'S': (198, 134, 82),
    's': (156, 91, 44),
    'B': (24, 18, 14),
    'E': (18, 13, 9),
    'W': (56, 182, 255),       # フロンターレサックスブルー
    'K': (30, 36, 43),         # 黒ストライプ
    'L': (255, 255, 255),      # FUJITSU 白ロゴ
    'P': (30, 39, 46),         # 黒パンツ
    'p': (15, 20, 26),
    'C': (45, 52, 54)
}

start_x = 180
start_y = 175
pixel_size = 7

for r, row in enumerate(matrix):
    for c, char in enumerate(row):
        if char in color_map:
            px = start_x + c * pixel_size
            py = start_y + r * pixel_size
            draw.rectangle([px, py, px + pixel_size, py + pixel_size], fill=color_map[char])

# サッカーボール
bx = start_x + 95
by = 285
bsize = 24
draw.ellipse([bx, by, bx + bsize, by + bsize], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
# ボール黒パッチ
draw.polygon([(bx+12, by+8), (bx+16, by+12), (bx+14, by+17), (bx+10, by+17), (bx+8, by+12)], fill=(20, 20, 20))

# 4. スライディング相手DF (赤)
slide_matrix = [
    "                   HHHH           ",
    "                 HHSSSS           ",
    "               RRRREERRR          ",
    "             RRRRRRRRRRRRR        ",
    "SSSSWWWWCCCCCRRRRRRRRRRRRRR       ",
    "SSSSWWWWCCCCCRRRRRRRRRRRRRR       ",
    "             SSSSWWWWCCCC         "
]
df_map = {
    'H': (44, 62, 80),
    'S': (224, 169, 124),
    'R': (231, 76, 60),
    'E': (0, 0, 0),
    'W': (255, 255, 255),
    'C': (34, 34, 34)
}
df_x = 330
df_y = 255
df_pixel = 6
for r, row in enumerate(slide_matrix):
    for c, char in enumerate(row):
        if char in df_map:
            px = df_x + c * df_pixel
            py = df_y + r * df_pixel
            draw.rectangle([px, py, px + df_pixel, py + df_pixel], fill=df_map[char])

# 土煙パーティクル
for px, py in [(df_x+180, 290), (df_x+195, 285), (df_x+210, 292), (df_x+225, 288)]:
    draw.rectangle([px, py, px+8, py+8], fill=(39, 174, 96))

# 5. タイトルロゴテキスト
# フォント（標準フォントまたはフォールバック）
try:
    font_large = ImageFont.truetype("/System/Library/Fonts/Hiragino Sans GB.ttc", 36)
    font_sub = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
except:
    font_large = ImageFont.load_default()
    font_sub = ImageFont.load_default()

# タイトル影とテキスト
title_text = "じわかわドリブル ⚽"
sub_text = "8-BIT DRIBBLE RUNNER"

# 帯シャドウ
draw.rectangle([0, 0, width, 75], fill=(0, 0, 0, 160))

# 文字描画
draw.text((32, 12), title_text, font=font_large, fill=(0, 0, 0))
draw.text((30, 10), title_text, font=font_large, fill=(255, 255, 255))

draw.text((362, 22), sub_text, font=font_sub, fill=(56, 182, 255))

# バッジ
draw.rectangle([width - 150, 16, width - 20, 52], fill=(255, 71, 87), outline=(255, 255, 255), width=2)
draw.text((width - 132, 22), "★ NEW ★", font=font_sub, fill=(255, 255, 255))

os.makedirs("/Users/ken/.gemini/antigravity-ide/scratch/townsnap-gallery-web/public/games/assets", exist_ok=True)
img.save("/Users/ken/.gemini/antigravity-ide/scratch/townsnap-gallery-web/public/games/assets/dribble_banner.png", "PNG")
print("Banner saved successfully!")

