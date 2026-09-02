---
theme: basic-bold
colorSchema: light
addons:
  - ../../../slidev-addon-shared
# background: https://cover.sli.dev
title: Photo Processes - Emerging Technologies
drawings:
  persist: false
# transition: fade
# enable MDC Syntax: https://sli.dev/features/mdc
mdc: true
fonts:
  sans: Public Sans
aspectRatio: 3/2
canvasWidth: 1440
layout: intro
---

### PUPH 2101

## Core Studio 1: Digital Practices

<br>
    
<bold-title>Specs of Digital Images</bold-title>


<slide-footer>

  ## Shabtai Pinchevsky

</slide-footer>

---
layout: center
width: 80
---

<bold-title>What are Digital Images?</bold-title>

<v-clicks>

Digital images are made up of a rectangular grid of tiny colored **pixels**, each storing an exact color value.

Digital images are characterized by their dimensions (width and height in pixels).

</v-clicks>

---
layout: image
image: ./images/Rgb-raster-image.svg.webp
scale: 70
---

---
layout: two-cols
---

<img src="./images/as11-40-5903~orig.webp">

<v-clicks>

5189 x 5067 pixels

= ~26.3 Megapixels

</v-clicks>

::right::

<img src="./images/as11-40-5903~large.webp">

<v-clicks>

1920 x 1874 pixels

= ~3.6 Megapixels

</v-clicks>

---
layout: two-cols
---

<img src="./images/as11-40-5903~orig-crop.webp">

5189 x 5067 pixels

= ~26.3 Megapixels

::right::

<img src="./images/as11-40-5903~large-crop.webp">

1920 x 1874 pixels

= ~3.6 Megapixels

---
layout: default
---

<bold-title>Common Screen Dimentions</bold-title>

<v-clicks>

HD Screen: 1920 x 1080 pixels = 2.1 Megapixels <br>

4K Screen: 3840 x 2160 pixels = 8.3 Megapixels <br>

iPhone: 2622 x 1206 = 3.2 Megapixels <br>

</v-clicks>

---
layout: center
width: 80
---

<img src="./images/as11-40-5903~large.webp" width="50%">

At 26.3 MP (5189 x 5067), this image can support a print of **28.8 x 28.1 inches** at 180 PPI (pixels per inch) <br>

= ~26.3 Megapixels


---
layout: center
width: 50
---

<bold-title>What Makes a Digital Photograph?</bold-title>

<v-clicks>

1. Resolution
2. Sensor Size
3. RAW / JPEG

</v-clicks>

---
layout: image
image: ./images/canonrspecs.webp
padding: minimal
---
https://www.bhphotovideo.com/c/product/1433710-REG/canon_eos_r_mirrorless_digital.html/specs

---
layout: default
---

<bold-title>Resolution</bold-title>

Actual: 31.7 Megapixels <br>
Effective: 30.3 Megapixels (6720x4480)

<img src="./images/Canon-410MP-CMOS-35mm-full-frame-sensor.webp">

---
layout: default
---
<bold-title>Digital Sensor</bold-title>

<img src="./images/image-sensor.webp">

---
layout: default
---
<bold-title>Bayer Filter</bold-title>

<img src="./images/bayer1.webp">

---
layout: default
---
<bold-title>Bayer Filter - results</bold-title>

<img src="./images/bayer2.webp">

---
layout: website-embed
url: https://en.wikipedia.org/wiki/Bayer_filter
padding: minimal
---

https://en.wikipedia.org/wiki/Bayer_filter

---
layout: default
---

<bold-title>Sensor Size</bold-title>

<v-click>
36 x 24 mm (Full-Frame) CMOS
</v-click>
<br>
<v-click>
    <img src="./images/35mm-Film-Photography-A-Beginners-Guide-Blog-1.webp">
</v-click>

---
layout: default
---

<bold-title>Sensor Size</bold-title>

8x10 (Large Format) <br>
<img src="./images/8x10.webp">

---
layout: default
---

<bold-title>Sensor Size</bold-title>

6x7 (Medium Format) 
<br><br>
<img src="./images/m71.webp">

---
layout: default
---

<bold-title>Sensor Size</bold-title>

6x7 (Medium Format) 
<br><br>
<img src="./images/m72.webp">

---
layout: default
---

<bold-title>Sensor Size</bold-title>

Digital Medium Format (43.8 x 32.9mm)

<br><br>
<img src="./images/fuji-gfx.webp">

---
layout: default
---

<bold-title>Sensor Size</bold-title>

Full-Frame / 35mm (36 x 24 mm)

<br><br>
<img src="./images/canon-eos-r.webp">

---
layout: default
---

<bold-title>Sensor Size</bold-title>

APS-C (23.6 x 15.7 mm)

<br><br>
<img src="./images/canon-eos-r7.webp">


---
layout: website-embed
url: https://taipinc.github.io/my-tools/tools/image-formats/?menu=collapsed
padding: minimal
---

---
layout: center
width: 80
---

<bold-title>Capture File Types</bold-title>

Most cameras allow you choose between producing RAW or JPEG files. They will also allow you to create both simultaneously.

---
layout: two-cols
---

<bold-title>RAW</bold-title>

<v-clicks>

Minimally processed sensor data

Meant for post-processing of images

Cannot be opened in a browser or most applications

White Balance and other settings are not baked into the image

Colors has high fidelity and dynamic range for editing

Bigger file size (~32 MB in the R)

</v-clicks>

::right::

<bold-title>JPEG</bold-title>

<v-clicks>

Compressed format

Meant for delivery and sharing of images

Supported across all browsers and applications

White Balance and other settings are baked into the image

Contains less color information and has less editing latitude

Smaller file size (~8 MB in the R)

</v-clicks>

---
layout: center
---

<bold-title>tl;dr</bold-title>
Capture in RAW, share in JPEG

<v-clicks>

Always capture in RAW

You can capture in RAW+JPEG if you want a quick shareable image

</v-clicks>

---
layout: center
---

<bold-title>New Terms</bold-title>

<v-clicks>

- Pixel = smallest picture element in a digital image
- MP = Megapixels = 1 million pixels
- MB = Megabytes, measure of file size
- RAW = minimally processed image from the camera sensor
- JPEG = compressed, processed image file

</v-clicks>
