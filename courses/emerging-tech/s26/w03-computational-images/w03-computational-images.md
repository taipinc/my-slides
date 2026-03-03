---
theme: apple-basic
colorSchema: light
addons:
  - ../../../slidev-addon-shared
# background: https://cover.sli.dev
title: Computational Images
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

# Images and Computation

<div class="absolute bottom-10">
  
## Week 4

</div>

---
layout: center
---

# How Does an iPhone Camera Work?

---
layout: image-caption
image: ./images/apple-iphone-xs-camera-layers-keynote-1.webp
---

iPhone 11 presentation – the processing pipeline of an image

---
layout: center
---

# "... apertures on smartphones are never shut. The press of the shutter button merely brackets the range of data that was already being captured as soon as the camera app was launched."

<div class="absolute bottom-10">

Ekalan Hou, *Computational Photography: The Production of Perpetual Targets*

</div>

---
layout: image-caption
image: ./images/panoptic_segmentation01.webp
---

[Panoptic Segmentation](https://arxiv.org/abs/1801.00868), 2018

---
layout: image-caption
image: ./images/panoptic_segmentation02.webp
---

[Panoptic Segmentation](https://arxiv.org/abs/1801.00868), 2018

---
layout: center
---

# ... while digital photography treats each pixel as a pixel, computational photography tries to "understand" what each pixel is. ... Computation photography uses machine learning to classify and to doctor each pixel based on training data.

<div class="absolute bottom-10">

Ekalan Hou, *Computational Photography: The Production of Perpetual Targets*

</div>

---
layout: image-caption
image: ./images/panoptic_segmentation03.webp
---

Apple's [On-device Panoptic Segmentation for Camera Using Transformers](https://machinelearning.apple.com/research/panoptic-segmentation), 2021

---
layout: image-caption
image: ./images/panoptic_segmentation04.webp
---

[TensorMask: A Foundation for Dense Object Segmentation](https://arxiv.org/abs/1903.12174), 2019

---
layout: center
---

# With each press of the shutter, segmentation architectures in smartphones slice the world into simplified and unambiguous categories and automate the user's acceptance of these classifications...

<div class="absolute bottom-10">

Ekalan Hou, *Computational Photography: The Production of Perpetual Targets*

</div>

---
layout: image-caption
image: ./images/panoptic_segmentation05.webp
---

[Mask R-CNN](https://arxiv.org/abs/1703.06870), 2017

---
layout: video-caption
video: https://www.youtube.com/watch?v=17FKTw4MCZ4
---

Evolved AI subject recognition & focus performance | Alpha 7R V | Sony | α

---
layout: center
---

# The civilian media technologies we use daily—which are always becoming more convenient, precise, and predictive—tend to be the "byproduct ot waste products of pure military research".

<div class="absolute bottom-10">

Ekalan Hou, *Computational Photography: The Production of Perpetual Targets*

</div>

---
layout: image-caption
image: ./images/depth-estimation.webp
---

[Depth Pro: Sharp Monocular Metric Depth in Less Than a Second](https://arxiv.org/abs/2410.02073)

---
layout: image-caption
image: ./images/portrait-mode.webp
---

---
layout: image-caption
image: ./images/ARKitScenes01.webp
---

[ARKitScenes: A Diverse Real-World Dataset For 3D Indoor Scene Understanding Using Mobile RGB-D Data](https://arxiv.org/abs/2111.08897), 2021

---
layout: center
---

# The consideration of computational photography requires a reorientation from the visual to the invisual, a shift away from images toward their infrastructural coupling with large-scale systems of sensing and computation.

<br>
<v-click>

# Rather than locating the exercise of power at the end of the photographic process—at the moment of capture—in computational photography, molecular policing and market operations take place in the "invisible worls" of machine-machine interactions, outside of human perceptibility.
</v-click>

<div class="absolute bottom-10">

Ekalan Hou, *Computational Photography: The Production of Perpetual Targets*

</div>

---
layout: image-caption
image: ./images/BX1778_PR.webp
---

## The Abacus

Near East, Europe, China, Russia
2300 BCE - and still in use

---
layout: image-right
image: ./images/232100762.webp
width: 60
align: top
---

## The Difference Engine

Charles Babbage, England, designed 1847-9 (built 1985-2002)

---
layout: center
---

## The history of the computer:
<br>
<v-click>

#### Attempting to mechanize mathematical calculations,
#### and using mathematics to represents media (images, sound, etc.)
</v-click>
<br>
<br>
<v-click>    

***
<br>
<br>
    
## What if we could "mechanize" other stuff? 
</v-click>
<br>
<v-clicks>

- #### Knowledge
- #### Language 
- #### Reasoning 
- #### Perception 
- #### Intelligence?
</v-clicks>

---
layout: image-caption
image: ./images/Dartmouth.webp
---

black-and-white-photo-of-seven-smiling-men-sitting-on-a-lawn-in-front-of-a-tree-and-a-white-school-building-with-many-windows.jpg

or: **The Dartmouth Summer Research Project on Artificial Intelligence**, 1956, Dartmouth College, NH

---
layout: default
---

## A few terms
<br>

- #### **Artificial Intelligence (AI)**: The broad field of creating machines that can perform tasks that typically require human intelligence, including reasoning, learning, and problem-solving.

---
layout: center
---

# Symbolic AI

---
layout: image-caption
image: ./images/BUCHANAN.webp
---

Rule-Based Expert Systems: The MYCIN Experiments of the Stanford Heuristic Programming Project

---
layout: image-caption
image: ./images/BUCHANAN2.webp
---

---
layout: image-caption
image: ./images/minnie_w_back_V3.webp
---

[MICrONS Explorer](https://www.microns-explorer.org/gallery-mm3-renders)

---
layout: center
---

# Neurons that fire together, wire together

#### - Donald Hebb, 1949

---
layout: image-caption
image: ./images/McCulloch-Pitts01.webp
---

McCulloch and Pitts, [*A Logical Calculus of the Ideas Immanent in Nervous Activity*](https://www.cs.cmu.edu/~epxing/Class/10715/reading/McCulloch.and.Pitts.pdf) (1943)

---
layout: image-caption
image: ./images/McCulloch-Pitts02.webp
---

McCulloch and Pitts, [*How We Know Universals*](https://www.cs.cmu.edu/~epxing/Class/10715/reading/McCulloch.and.Pitts.pdf) (1947)

---
layout: image-right
image: ./images/RMC2008_0011.webp
align: top
width: 55
---

## Mark I Perceptron 
At the Cornell Aeronautical Laboratory

Developed by Frank Rosenblatt in 1958

Buffalo, New York

---
layout: image-caption
image: ./images/0925_rosenblatt5.webp
---

Frank Rosenblatt and the Mark I Perceptron, 1958

---
layout: image-caption
image: ./images/0925_rosenblatt4.webp
---

An image of the perceptron from Rosenblatt's “The Design of an Intelligent Automaton,” Summer 1958.

---
layout: image-caption
image: ./images/perceptron-simulator.webp
---

[Perceptron Simulator](https://taipinc.github.io/perceptron-simulator/)

---
layout: image-caption
image: ./images/NYTimes_p.webp
---

[NEW NAVY DEVICE LEARNS BY DOING](https://nyti.ms/3N0UoCJ), New York Times, 1958

---
layout: image-caption
image: ./images/Murray1.webp
---

[*Perceptron Applicability to Photointerpretation*](https://hdl.handle.net/2027/coo.31924004665000), by Murray, 1960

---
layout: image-caption
image: ./images/Murray2.webp
---

[*Perceptron Applicability to Photointerpretation*](https://hdl.handle.net/2027/coo.31924004665000), by Murray, 1960

---
layout: image-caption
image: ./images/Murray3.webp
---

[*Perceptron Applicability to Photointerpretation*](https://hdl.handle.net/2027/coo.31924004665000), by Murray, 1960

---
layout: image-caption
image: ./images/Murray4.webp
---

[*Perceptron Applicability to Photointerpretation*](https://hdl.handle.net/2027/coo.31924004665000), by Murray, 1960

---
layout: center
---

#### Two Artificial Intelligence Paradigms:
<br>
<v-click>    

## Symbolic AI
</v-click>
<br>
<v-click>

## Machine Learning (Connectivism)
</v-click>

---
layout: default
---

## A few terms
<br>
    
- #### **Artificial Intelligence (AI)**: The broad field of creating machines that can perform tasks that typically require human intelligence, including reasoning, learning, and problem-solving.

<v-click>
<br>
    
- #### **Machine Learning (ML)**: An approach to AI that gives computers the ability to learn without being explicitly programmed.

</v-click>

---
layout: image-caption
image: ./images/frog01.webp
---

*What the Frog's Eye Tells the Frog's Brain*, by Lettvin et al., 1959

A frog's retina acts as a pre-processor, sending specialized information to the brain rather than just raw visual data. The eye specifically detects four key features optimized for survival: small moving dark objects (bugs), edges, movement, and sharp contrast

---
layout: image-caption
image: ./images/frog02.webp
---

*What the Frog's Eye Tells the Frog's Brain*, by Lettvin et al., 1959

---
layout: image-caption
image: ./images/frog03.webp
---

*What the Frog's Eye Tells the Frog's Brain*, by Lettvin et al., 1959

---
layout: image-caption
image: ./images/whatthemouse.webp
---

---
layout: image-caption
image: ./images/CNN1.webp
---

- 1990s: Convolutional Neural Networks (CNNs) developed by Yann LeCun and others, leading to advances in image recognition. Handwritten digit recognition (MNIST dataset).

[Convolutional Neural Network on the MNIST digits dataset](https://cs.stanford.edu/people/karpathy/convnetjs/demo/mnist.html)

---
layout: image-caption
image: ./images/CNN2.webp
---

[2D convolutional network visualization](https://adamharley.com/nn_vis/cnn/2d.html)

---
layout: image-caption
image: ./images/CNN3.webp
---

[CNN Explainer](https://poloclub.github.io/cnn-explainer/)

---
layout: image-caption
image: ./images/CNN4.webp
---

[CNN Inference Visualizer](https://huggingface.co/spaces/taipinch/cnn-visualizer)

---
layout: video-caption
video: https://www.youtube.com/watch?v=aircAruvnKk
---

[But what is a neural network? | Deep learning chapter 1](https://www.youtube.com/watch?v=aircAruvnKk), 3Blue1Brown

---
layout: default
---

## A few terms
<br>
    
- #### **Artificial Intelligence (AI)**: The broader field of creating machines that can perform tasks that typically require human intelligence, including reasoning, learning, and problem-solving.
<br>

- #### **Machine Learning (ML)**: An approach to AI that gives computers the ability to learn without being explicitly programmed.
<br>
<v-click>

- #### **Neural Networks**: Computational models inspired by the human brain, consisting of interconnected layers of nodes (neurons) that process and transmit information, used in deep learning.

</v-click>
<br>
<v-click>

- #### **Training**: The process of feeding data into a machine learning model to adjust its parameters so that it can make accurate predictions based on that data.
</v-click><br>
<v-click>

- #### **Inference**: The process of using a trained machine learning model to make predictions or decisions based on new, unseen data.
</v-click>

---
layout: image-caption
image: ./images/training-inference.webp
---
- #### **Training**: The process of feeding data into a machine learning model to adjust its parameters so that it can make accurate predictions based on that data.
<br>

- #### **Inference**: The process of using a trained machine learning model to make predictions or decisions based on new, unseen data.

---
layout: video-caption
video: https://www.youtube.com/watch?v=GVsUOuSjvcg&t=1098s
start: 494
---

[Future Computers Will Be Radically Different (Analog Computing)] (https://www.youtube.com/watch?v=GVsUOuSjvcg&t=1098s)

---
layout: image-caption
image: ./images/navigu-net.webp
---

[ImageNet](https://navigu.net/#imagenet) - a large visual database designed for use in visual object recognition research, 2006

---
layout: website-embed
url: https://deeplearning.cms.waikato.ac.nz/user-guide/class-maps/IMAGENET/
---

[IMAGENET 1000 Class List](https://deeplearning.cms.waikato.ac.nz/user-guide/class-maps/IMAGENET/)

---
layout: image-caption
image: ./images/alexnet.webp
---

**AlexNet** - a deep convolutional neural network that significantly outperforms previous methods on the ImageNet challenge, sparking renewed interest in deep learning, 2012

---
layout: default
---

## A few terms
<br>
    
- #### **Artificial Intelligence (AI)**: The broader field of creating machines that can perform tasks that typically require human intelligence, including reasoning, learning, and problem-solving.
<br>

- #### **Machine Learning (ML)**: An approach to AI that gives computers the ability to learn without being explicitly programmed.
<br>

- #### **Neural Networks**: Computational models inspired by the human brain, consisting of interconnected layers of nodes (neurons) that process and transmit information, used in deep learning.


- #### **Training**: The process of feeding data into a machine learning model to adjust its parameters so that it can make accurate predictions based on that data.
<br>
    
- #### **Inference**: The process of using a trained machine learning model to make predictions or decisions based on new, unseen data.
<br>
<v-click>

- #### **Deep Learning**: A subset of machine learning that uses neural networks with many layers (deep neural networks) to model complex patterns in data, particularly effective for tasks like image and speech recognition.
</v-click>

---
layout: image-caption
image: ./images/prop-open.webp
---

Propeietary vs Open Source Models

---
layout: image-caption
image: ./images/local-cloud.webp
---

Local vs Cloud Inference

---

# What needs unpacking in the next few weeks?

## Today:
<br>
    
#### - Models
<br>
<br>
    
## Coming up:
<br>
    
#### - Datasets: the biases and limitations inherent in their use and circulation
#### - The cloud: the implications of cloud-based training and inference
