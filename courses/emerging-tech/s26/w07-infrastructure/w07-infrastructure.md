---
theme: apple-basic
colorSchema: light
addons:
  - ../../../slidev-addon-shared
# background: https://cover.sli.dev
title: The Infrastructure of Machine Vision
drawings:
  persist: false
# transition: fade
# enable MDC Syntax: https://sli.dev/features/mdc
mdc: true
fonts:
  sans: Geist
aspectRatio: 3/2
canvasWidth: 1440

layout: intro
---
## PSAM 2802: Photo Processes: Emerging Technologies

# The Infrastructure of Machine Vision

<div class="absolute bottom-10">
  <span class="font-700">
  
## Week 7

  </span>
</div>

---
layout: image-caption
image: ./images/racist-history-facial-reco.webp
---

[The Racist History Behind Facial Recognition](https://archive.md/migHO), July 10, 2019, New York Times

---
layout: image-caption
image: ./images/Composite_portraiture_Galton1.webp
---

[Composite Portraiture](https://commons.wikimedia.org/wiki/File:Composite_portraiture_Galton.jpg), Francis Galton, 1883

---
layout: image-caption
image: ./images/Composite_portraiture_Galton2.webp
---

[Composite-Fotografie](http://www.medienkunstnetz.de/works/composite-fotografie/), Francis Galton

<br/>
The composite process resulted in producing a slightly blurred image, which, as Galton wrote, "portrayed no specific type of person, but rather an imaginary figure endowed with the average characteristics of a specific group of people. This represents the portrait of a type and not of an individual."

---
layout: image-caption
image: ./images/aft.2023.50.2.112.f02.webp
---

Michal Kosinski and Yilun Wang, “Deep neural networks are more accurate than humans at detecting sexual orientation from facial images”

---
layout: image-caption
image: ./images/DP263824.webp
---

[Album of Paris Crime Scenes](https://www.metmuseum.org/art/collection/search/284718), Alphonse Bertillon, 1901-8

---
layout: image-caption
image: ./images/DP362642.webp
---

[Tableau synoptic des traits physionomiques: pour servir a l'étude du "portrait parlé"](https://www.metmuseum.org/art/collection/search/289245), Alphonse Bertillon, 1909

---

# Datasets

---
layout: image-caption
image: ./images/hf-datasets.webp
---

[Hugging Face – Datasets](https://huggingface.co/datasets)

---
layout: image-caption
image: ./images/Paglen-Behold_2017.webp
---

[Behold These Glorious Times!](https://kadist.org/work/behold-these-glorious-times/), Trevor Paglen, 2017

---
layout: website-embed
url: https://excavating.ai/
---


[Excavating AI](https://excavating.ai/), By Kate Crawford and Trevor Paglen, 2019

---
layout: center
---

<div class="text-2xl">

This arc of inevitability recurs in many AI narratives, where it is assumed that ongoing technical improvements will resolve all problems and limitations.

<br/>

<v-click>

What if the challenge of getting computers to “describe what they see” will always be a problem? In this essay, we will explore why the automated interpretation of images is an inherently social and political project, rather than a purely technical one. Understanding the politics within AI systems matters more than ever, as they are quickly moving into the architecture of social institutions: deciding whom to interview for a job, which students are paying attention in class, which suspects to arrest, and much else.

</v-click>

</div>

---
layout: center
---

<div class="text-2xl">

But when we look at the training images widely used in computer-vision systems, we find a bedrock composed of shaky and skewed assumptions. For reasons that are rarely discussed within the field of computer vision, and despite all that institutions like MIT and companies like Google and Facebook have done, the project of interpreting images is a profoundly complex and relational endeavor. Images are remarkably slippery things, laden with multiple potential meanings, irresolvable questions, and contradictions. Entire subfields of philosophy, art history, and media theory are dedicated to teasing out all the nuances of the unstable relationship between images and meanings.

</div>

---
layout: image-caption
image: ./images/jaffe.webp
---
[JAFFE Database](https://www.kasrl.org/jaffe.html), 1997, Kyushu University

happiness / sadness / surprise / disgust / fear / anger / neutral

---
layout: center
--- 

<div class="text-2xl">

There are several implicit assertions in the JAFFE set. First there’s the taxonomy itself: 

<v-clicks>

- That “emotions” is a valid set of visual concepts. Then there’s a string of additional assumptions: 
- That the concepts within “emotions” can be applied to photographs of people’s faces (specifically Japanese women); 
- That there are six emotions plus a neutral state; 
- That there is a fixed relationship between a person’s facial expression and her true emotional state; 
- That this relationship between the face and the emotion is consistent, measurable, and uniform across the women in the photographs. 

</v-clicks>

<v-click>

Every one of the implicit claims made at each level is, at best, open to question, and some are deeply contested

</v-click>

</div>

---
layout: image-caption
image: ./images/amazon-rekog.webp
---

---
layout: center
---

<div class="text-2xl">

The circuit between image, label, and referent is flexible and can be reconstructed in any number of ways to do different kinds of work.

<br/>

<v-click>

Images are open to interpretation and reinterpretation.

</v-click>

<br/>

<v-click>

Despite the common mythos that AI and the data it draws on are objectively and scientifically classifying the world, everywhere there is politics, ideology, prejudices, and all of the subjective stuff of history. When we survey the most widely used training sets, we find that this is the rule rather than the exception.

</v-click>

</div>

---
layout: video-caption
video: https://www.youtube.com/watch?v=G2XdZIC3AM8
start: 325
---

---
layout: website-embed
url: https://knowingmachines.org/models-all-the-way
---

[Models all the Way Down](https://knowingmachines.org/models-all-the-way), Christo Buschek & Jer Thorp, 2011

---
layout: website-embed
url: https://www.tldraw.com/p/F5UMuDKuN-7vCvEY3JPlO?d=v-4622.291.1190.823.page
---

---
layout: center
---

<div class="text-2xl">


The researchers admit that these models are "not perfect." That the metrics should not be used to create “production-ready” subsets.

<v-clicks>

This is a convenient way to avoid responsibility, and leans heavily on a core philosophy of software-based research: that if you make the problems visible, someone down the line will step up and fix them.

In their paper, the LAION devs "advocate using these tags responsibly," to not rely on them for making "truly safe" versions of their dataset.

Beyond that, no advice is given about what responsible use might look like.




</v-clicks>

</div>

---
layout: image-caption
image: ./images/pipa.webp
---

[Exposing.ai: People in Photo Albums](https://exposing.ai/pipa/)

---
layout: website-embed
url: https://humans-of.ai/
---

[Humans of AI](https://humans-of.ai/), [Philipp Schmitt](https://philippschmitt.com/index), 2019

---
layout: image-caption
image: ./images/gourault.webp
---

[Their Eyes](https://www.nytimes.com/video/opinion/100000010486246/their-eyes.html?searchResultPosition=6), [Nicolas Gourault](https://nicolasgourault.fr/), 2026, The New York Times Opinion

---
layout: image-caption
image: ./images/mo_the-library-of-missing-datasetss_01_rt_hr.webp
---

Mimi Ọnụọha, The Library of Missing Datasets (2015–ongoing)

---
layout: image-caption
image: ./images/mo_the-library-of-missing-datasetss_05_rt_hr.webp
---

Mimi Ọnụọha, The Library of Missing Datasets (2015–ongoing)

---
layout: image-caption
image: ./images/mo_the-library-of-missing-datasetss_06_rt_hr.webp
---

Mimi Ọnụọha, The Library of Missing Datasets (2015–ongoing)

---
layout: video-caption
video: https://www.youtube.com/watch?v=93rjwQMww9M
---

[Forensic Architecture](https://forensic-architecture.org/), [Triple Chaser](https://forensic-architecture.org/investigation/triple-chaser), 2019

---

# Infrastructure


---
layout: image-caption
image: ./images/anatomy-of-ai.webp
---

[Anatomy of an AI System](https://anatomyof.ai/)

---
layout: website-embed
url: https://cdn.robinhood.com/assets/sherwood/hyperion-size-comparison-2026-01-20/index.html
---

[Just how big is Meta's Hyperion data center site?](https://sherwood.news/tech/see-for-yourself-just-how-massive-metas-hyperion-data-center-is/)

---
layout: website-embed
url: https://energy-minne.vercel.app/
---

[ENERGY.TXT](https://energy-minne.vercel.app/), [Minne Atairu](https://minneatairu.com/)
