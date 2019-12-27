# mosaic-p5-revised
Original mosaic image creator with octree for comparing points.
This revised version should be more accurate, and run faster.

Program now runs and operates alot faster, and is more accurate than the original mosiac p5 program.

This program uses an octree filled with average rgb values from a list of images, and each pixel in the main image is queried in the octree and the image with the closest average rgb vaue is the image thats used in place of the pixel from the main image at point x,y. If theres a situation where the quadrant that a pixel falls into is empty the program finds the next quandrant thats not empty be it left or right and finds the image closest rgb value amoung that quandrant.

program is currently being restructered to upload images only to gcs, and accept user input images.

Things to fix:
Havent yet run into a crashing issue when uploading images most that have been uploaded and processed in p5 right now is 292, image limit is currently unknown.
Program runs faster than before, I still haven't measured that difference however.
Webpage added for users to input their images, using js, html, and css.
bugs(program doesnt always upload all the images in a selected folder an example being upon uploading 306 images only 292 have been uploaded this number also varies occasionally will look into this further) and vulnerabilities.

Link to heroku: https://mosiac-p5.herokuapp.com/
