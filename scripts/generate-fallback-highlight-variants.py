from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
FALLBACK_DIR = ROOT / "public" / "exercise-illustrations" / "fallback"
BLUE = (10, 132, 255)

Shape = tuple[str, tuple[float, ...]]


def ellipse(x0: float, y0: float, x1: float, y1: float) -> Shape:
    return ("ellipse", (x0, y0, x1, y1))


def polygon(*points: tuple[float, float]) -> Shape:
    flat: list[float] = []
    for x, y in points:
        flat.extend((x, y))
    return ("polygon", tuple(flat))


def mirrored_polygon(points: Iterable[tuple[float, float]]) -> Shape:
    return polygon(*[(512 - x, y) for x, y in points])


def draw_shapes(mask: Image.Image, shapes: Iterable[Shape]) -> None:
    draw = ImageDraw.Draw(mask)
    for kind, values in shapes:
        if kind == "ellipse":
            draw.ellipse(values, fill=255)
            continue

        points = list(zip(values[0::2], values[1::2], strict=False))
        draw.polygon(points, fill=255)


def tint_with_mask(base: Image.Image, mask: Image.Image) -> Image.Image:
    base = base.convert("RGBA")
    mask = mask.filter(ImageFilter.GaussianBlur(0.7))
    source = base.load()
    mask_pixels = mask.load()
    output = Image.new("RGBA", base.size, (0, 0, 0, 0))
    out = output.load()

    for y in range(base.height):
        for x in range(base.width):
            r, g, b, a = source[x, y]
            if a == 0:
                continue

            m = mask_pixels[x, y] / 255
            if m == 0:
                out[x, y] = (r, g, b, a)
                continue

            brightness = max(r, g, b)
            line_protection = min(max((brightness - 115) / 140, 0), 0.82)
            blend = m * 0.86 * (1 - line_protection)
            nr = round(r * (1 - blend) + BLUE[0] * blend)
            ng = round(g * (1 - blend) + BLUE[1] * blend)
            nb = round(b * (1 - blend) + BLUE[2] * blend)
            out[x, y] = (nr, ng, nb, a)

    return output


def variant(base_relative: str, output_relative: str, shapes: Iterable[Shape]) -> None:
    base = Image.open(FALLBACK_DIR / base_relative).convert("RGBA")
    mask = Image.new("L", base.size, 0)
    draw_shapes(mask, shapes)
    output = tint_with_mask(base, mask)
    output_path = FALLBACK_DIR / output_relative
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path)


UPPER_FRONT = "upper-front/upper-front.png"
UPPER_BACK = "upper-back/upper-back.png"
LOWER_FRONT = "lower-front/lower-front.png"
LOWER_BACK = "lower-back/lower-back.png"
FULL_FRONT = "full-front/full-front.png"
FULL_BACK = "full-back/full-back.png"


CHEST_LEFT = polygon((128, 154), (248, 148), (252, 206), (231, 235), (157, 230), (117, 188))
CHEST_RIGHT = mirrored_polygon([(128, 154), (248, 148), (252, 206), (231, 235), (157, 230), (117, 188)])
CHEST_UPPER_LEFT = polygon((129, 153), (248, 148), (252, 190), (169, 197), (118, 181))
CHEST_UPPER_RIGHT = mirrored_polygon([(129, 153), (248, 148), (252, 190), (169, 197), (118, 181)])
CHEST_LOWER_LEFT = polygon((151, 205), (248, 198), (250, 216), (229, 236), (158, 231), (126, 195))
CHEST_LOWER_RIGHT = mirrored_polygon([(151, 205), (248, 198), (250, 216), (229, 236), (158, 231), (126, 195)])
CHEST_OUTER_LEFT = polygon((119, 176), (159, 169), (170, 229), (136, 216), (111, 192))
CHEST_OUTER_RIGHT = mirrored_polygon([(119, 176), (159, 169), (170, 229), (136, 216), (111, 192)])
SHOULDER_FRONT = [ellipse(86, 150, 151, 231), ellipse(361, 150, 426, 231)]
SHOULDER_MIDDLE = [ellipse(80, 156, 145, 249), ellipse(367, 156, 432, 249)]
UPPER_ARM_FRONT = [ellipse(83, 218, 143, 315), ellipse(369, 218, 429, 315)]
BICEPS = [ellipse(92, 213, 147, 306), ellipse(365, 213, 420, 306)]
FOREARMS_FRONT = [
    polygon((69, 309), (113, 319), (91, 426), (52, 395)),
    mirrored_polygon([(69, 309), (113, 319), (91, 426), (52, 395)]),
]
RECTUS = [
    ellipse(205, 238, 253, 317),
    ellipse(259, 238, 307, 317),
    ellipse(207, 306, 253, 381),
    ellipse(259, 306, 305, 381),
]
TRANSVERSE = [polygon((168, 326), (344, 326), (326, 409), (186, 409))]
OBLIQUES = [
    polygon((161, 232), (207, 252), (198, 392), (148, 342)),
    mirrored_polygon([(161, 232), (207, 252), (198, 392), (148, 342)]),
]

BACK_LAT_LEFT = polygon((130, 166), (248, 148), (235, 365), (151, 334), (105, 234))
BACK_LAT_RIGHT = mirrored_polygon([(130, 166), (248, 148), (235, 365), (151, 334), (105, 234)])
BACK_THICKNESS = [
    polygon((190, 93), (255, 125), (247, 299), (204, 252)),
    mirrored_polygon([(190, 93), (255, 125), (247, 299), (204, 252)]),
]
BACK_TRAPS = [
    polygon((166, 96), (255, 97), (245, 187), (176, 176)),
    mirrored_polygon([(166, 96), (255, 97), (245, 187), (176, 176)]),
]
BACK_ERECTORS = [polygon((236, 97), (276, 97), (285, 378), (227, 378))]
SHOULDER_REAR = [ellipse(86, 151, 169, 233), ellipse(343, 151, 426, 233)]
TRICEPS_BACK = [ellipse(77, 214, 136, 315), ellipse(376, 214, 435, 315)]

QUADS = [
    polygon((174, 94), (248, 84), (237, 323), (190, 340), (161, 205)),
    mirrored_polygon([(174, 94), (248, 84), (237, 323), (190, 340), (161, 205)]),
]
ADDUCTORS = [
    polygon((229, 94), (258, 111), (244, 326), (216, 280)),
    mirrored_polygon([(229, 94), (258, 111), (244, 326), (216, 280)]),
]
FRONT_GLUTE_HINT = [ellipse(144, 54, 238, 143), ellipse(274, 54, 368, 143)]

GLUTES = [ellipse(166, 54, 260, 180), ellipse(252, 54, 346, 180)]
HAMSTRINGS = [
    polygon((176, 172), (247, 169), (239, 346), (194, 348), (163, 247)),
    mirrored_polygon([(176, 172), (247, 169), (239, 346), (194, 348), (163, 247)]),
]
CALVES = [ellipse(159, 315, 229, 454), ellipse(283, 315, 353, 454)]

FULL_CHEST = [
    polygon((164, 117), (252, 113), (253, 157), (236, 177), (182, 174), (151, 143)),
    mirrored_polygon([(164, 117), (252, 113), (253, 157), (236, 177), (182, 174), (151, 143)]),
]
FULL_SHOULDERS = [ellipse(125, 125, 177, 188), ellipse(335, 125, 387, 188)]
FULL_ARMS = [ellipse(110, 190, 158, 277), ellipse(354, 190, 402, 277)]
FULL_QUADS = [
    polygon((193, 291), (249, 288), (240, 410), (207, 415), (183, 340)),
    mirrored_polygon([(193, 291), (249, 288), (240, 410), (207, 415), (183, 340)]),
]
FULL_RECTUS = [
    ellipse(219, 172, 253, 230),
    ellipse(259, 172, 293, 230),
    ellipse(220, 225, 253, 279),
    ellipse(259, 225, 292, 279),
]
HIP_FLEXORS = [
    polygon((205, 287), (250, 284), (235, 365), (194, 342)),
    mirrored_polygon([(205, 287), (250, 284), (235, 365), (194, 342)]),
]

FULL_BACK_ERECTORS = [polygon((236, 92), (276, 92), (284, 290), (228, 290))]
FULL_BACK_LATS = [
    polygon((185, 125), (252, 112), (242, 283), (197, 251), (169, 175)),
    mirrored_polygon([(185, 125), (252, 112), (242, 283), (197, 251), (169, 175)]),
]
FULL_BACK_GLUTES = [ellipse(200, 255, 258, 330), ellipse(254, 255, 312, 330)]
FULL_BACK_HAMS = [
    polygon((207, 326), (250, 326), (244, 421), (218, 421), (198, 363)),
    mirrored_polygon([(207, 326), (250, 326), (244, 421), (218, 421), (198, 363)]),
]
FULL_BACK_CALVES = [ellipse(204, 398, 241, 474), ellipse(271, 398, 308, 474)]


def main() -> None:
    variants: dict[str, tuple[str, list[Shape]]] = {
        "upper-front/chest-overall.png": (UPPER_FRONT, [CHEST_LEFT, CHEST_RIGHT]),
        "upper-front/chest-upper.png": (UPPER_FRONT, [CHEST_UPPER_LEFT, CHEST_UPPER_RIGHT]),
        "upper-front/chest-lower.png": (UPPER_FRONT, [CHEST_LOWER_LEFT, CHEST_LOWER_RIGHT]),
        "upper-front/chest-outer.png": (UPPER_FRONT, [CHEST_OUTER_LEFT, CHEST_OUTER_RIGHT]),
        "upper-front/shoulders-front.png": (UPPER_FRONT, SHOULDER_FRONT),
        "upper-front/shoulders-middle.png": (UPPER_FRONT, SHOULDER_MIDDLE),
        "upper-front/arms-biceps.png": (UPPER_FRONT, BICEPS),
        "upper-front/arms-forearms.png": (UPPER_FRONT, FOREARMS_FRONT),
        "upper-front/core-rectus.png": (UPPER_FRONT, RECTUS),
        "upper-front/core-transverse.png": (UPPER_FRONT, TRANSVERSE),
        "upper-front/core-obliques.png": (UPPER_FRONT, OBLIQUES),
        "upper-front/chest-triceps.png": (UPPER_FRONT, [CHEST_LEFT, CHEST_RIGHT, *UPPER_ARM_FRONT]),
        "upper-front/chest-lower-triceps.png": (UPPER_FRONT, [CHEST_LOWER_LEFT, CHEST_LOWER_RIGHT, *UPPER_ARM_FRONT]),
        "upper-front/shoulders-triceps.png": (UPPER_FRONT, [*SHOULDER_FRONT, *UPPER_ARM_FRONT]),
        "upper-back/back-overall.png": (UPPER_BACK, [BACK_LAT_LEFT, BACK_LAT_RIGHT, *BACK_THICKNESS]),
        "upper-back/back-width.png": (UPPER_BACK, [BACK_LAT_LEFT, BACK_LAT_RIGHT]),
        "upper-back/back-thickness.png": (UPPER_BACK, BACK_THICKNESS),
        "upper-back/back-traps.png": (UPPER_BACK, BACK_TRAPS),
        "upper-back/back-erectors.png": (UPPER_BACK, BACK_ERECTORS),
        "upper-back/shoulders-rear.png": (UPPER_BACK, SHOULDER_REAR),
        "upper-back/arms-triceps.png": (UPPER_BACK, TRICEPS_BACK),
        "upper-back/back-biceps.png": (UPPER_BACK, [BACK_LAT_LEFT, BACK_LAT_RIGHT, *TRICEPS_BACK]),
        "upper-back/back-traps-shoulders-rear.png": (UPPER_BACK, [*BACK_TRAPS, *SHOULDER_REAR]),
        "lower-front/legs-quads.png": (LOWER_FRONT, QUADS),
        "lower-front/legs-adductors.png": (LOWER_FRONT, ADDUCTORS),
        "lower-front/quads-glutes.png": (LOWER_FRONT, [*QUADS, *FRONT_GLUTE_HINT]),
        "lower-back/legs-hamstrings.png": (LOWER_BACK, HAMSTRINGS),
        "lower-back/legs-glutes.png": (LOWER_BACK, GLUTES),
        "lower-back/legs-calves.png": (LOWER_BACK, CALVES),
        "lower-back/glutes-hamstrings.png": (LOWER_BACK, [*GLUTES, *HAMSTRINGS]),
        "full-front/core-hip-flexors.png": (FULL_FRONT, [*FULL_RECTUS, *HIP_FLEXORS]),
        "full-front/full-body-front.png": (FULL_FRONT, [*FULL_CHEST, *FULL_SHOULDERS, *FULL_ARMS, *FULL_RECTUS, *FULL_QUADS]),
        "full-back/posterior-chain.png": (FULL_BACK, [*FULL_BACK_ERECTORS, *FULL_BACK_LATS, *FULL_BACK_GLUTES, *FULL_BACK_HAMS, *FULL_BACK_CALVES]),
    }

    for output, (base, shapes) in variants.items():
        variant(base, output, shapes)


if __name__ == "__main__":
    main()
