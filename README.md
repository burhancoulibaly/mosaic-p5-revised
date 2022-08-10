# Mosaic Image Generator
Mosaic image generator with octree for comparing points.

This program uses an octree filled with average rgb values from a list of images, and each pixel in the main image is queried in the octree and the image with the closest average rgb vaue is the image thats used in place of the pixel from the main image at point x,y. If theres a situation where the quadrant that a pixel falls into is empty the program finds the next quandrant thats not empty be it left or right and finds the image closest rgb value amoung that quandrant.

Link to demo on heroku: https://mosaic-p5.herokuapp.com/
