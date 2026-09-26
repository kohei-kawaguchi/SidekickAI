import json
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter


def edge_connected_background(rgb, threshold):
    near_white = (rgb >= threshold).all(axis=2)
    height, width = near_white.shape
    background = np.zeros_like(near_white)
    queue = deque()
    for x in range(width):
        for y in (0, height - 1):
            if near_white[y, x] and not background[y, x]:
                background[y, x] = True
                queue.append((y, x))
    for y in range(height):
        for x in (0, width - 1):
            if near_white[y, x] and not background[y, x]:
                background[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < height and 0 <= nx < width and near_white[ny, nx] and not background[ny, nx]:
                background[ny, nx] = True
                queue.append((ny, nx))
    return background


def remove_background(source, target, threshold, feather_radius):
    image = Image.open(source).convert("RGB")
    rgb = np.asarray(image)
    background = edge_connected_background(rgb, threshold)
    alpha = Image.fromarray(np.where(background, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.GaussianBlur(feather_radius))
    rgba = image.convert("RGBA")
    rgba.putalpha(alpha)
    rgba.crop(rgba.getbbox()).save(target)


if __name__ == "__main__":
    config = json.load(open(sys.argv[1], encoding="utf-8"))["character"]
    remove_background(config["source"], config["image"], config["backgroundThreshold"], config["featherRadius"])
