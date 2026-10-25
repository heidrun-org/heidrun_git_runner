# Branding

- Created: 25 October 2026
- Last updated: 25 October 2026
- Status: Maintained rules for agents and tools
- Related framing: [Project instructions](../AGENTS.md)
- Related rules: [Product](agents_rules/product.md)

Git Runner uses the branding of Heidrun Code: the goat Heiðrún. The images are in the folder [data/images](../data/images). They are copies of the folder `data/images` of the repository [heidrun](https://github.com/heidrun-org/heidrun), which is the source. When an image changes there, copy it again here.

## The colors

- Orange: `#D9480F`, the background of the icon.
- Cream: `#FFF4DC`, the goat head on the icon.

## The images

- `data/images/heidrun_icon.png`: the icon, a cream goat head on an orange square with round corners, 512 × 512 pixels.
- `data/images/heidrun_favicon.svg`: the same icon as a vector image, for the icon of a browser tab.
- `data/images/heidrun_icon_goat_only.svg`: the goat head alone, with no square, 16 × 16. It takes the color of the text (`currentColor`), like an icon of Bootstrap Icons.
- `data/images/heidrun_icon_goat_with_border.svg`: the goat head in a square border with round corners, 16 × 16, also in the color of the text.
- `data/images/baby_goat.png`: the baby goat with the golden horns, on a transparent background, 1254 × 1254 pixels.
- `data/images/heidrun_splash_screen.png`: the splash image, the goat Heiðrún on top of Valhalla, pouring mead into a cauldron, 1254 × 1254 pixels.

## Rules

- Use only these images and these two colors for the branding. Never make a new logo or a new icon.
- The game draws every picture with code, and the package `packages/git_runner` has no image file, as its [CONTEXT.md](../packages/git_runner/CONTEXT.md) says. The images of `data/images` are for the communication: the file README.md, the page of the repository, and the announcements.
