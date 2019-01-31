# mosaic-p5-revised
Original mosaic image creator with octree for comparing points.
This revised version should be more accurate, and run faster.

Program now runs and operates alot faster, and is more accurate than the original mosiac p5 program.

This program uses an octree filled with average rgb values from a list of images, and each pixel in the main image is queried in the octree and the image with the closest average rgb vaue is the image thats used in place of the pixel from the main image at point x,y. If theres a situation where the quadrant that a pixel falls into is empty the program finds the next quandrant thats not empty be it left or right and finds the image closest rgb value amoung that quandrant.

Things to fix:
Theres a limit to the amount of images that can be loaded in p5 before the program crashes, going to see if this can be fixed.
Also going to find a way to optimize the program to run faster.
Add a gui.
bugs and vulnerabilities.
