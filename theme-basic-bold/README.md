# @slidev/theme-basic-bold

A local Slidev theme based on `@slidev/theme-apple-basic`, with an additional
display-title component using Knewave from Google Fonts.

## Usage

Select the theme in presentation frontmatter:

```yaml
theme: basic-bold
```

Use the display title in slide Markdown:

```html
<bold-title>
  A more expressive title
</bold-title>
```

The component renders an `h1`, so it remains the slide's semantic top-level
heading without changing the appearance of regular Markdown headings.

Add optional text to the bottom of a slide with `slide-footer`:

```html
<slide-footer>
  Left-aligned footer text
</slide-footer>

<slide-footer align="center">
  Centered footer text
</slide-footer>
```

The supported alignments are `left` (the default), `center`, and `right`.

The `center` layout accepts a percentage width for its content:

```md
---
layout: center
width: 60
---

# This content uses 60% of the slide's usable width
```

When `width` is omitted, the layout retains Slidev's original content-sized
centering. Explicit widths are constrained to the range `1`–`100`.
