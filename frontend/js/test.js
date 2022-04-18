/**
 * @module Image
 * @submodule Loading & Displaying
 * @for p5
 * @requires core
 */
/**
* Loads an image from a path and creates a <a href="#/p5.Image">p5.Image</a> from it.
*
* The image may not be immediately available for rendering.
* If you want to ensure that the image is ready before doing
* anything with it, place the <a href="#/p5/loadImage">loadImage()</a> call in <a href="#/p5/preload">preload()</a>.
* You may also supply a callback function to handle the image when it's ready.
*
* The path to the image should be relative to the HTML file
* that links in your sketch. Loading an image from a URL or other
* remote location may be blocked due to your browser's built-in
* security.

* You can also pass in a string of a base64 encoded image as an alternative to the file path.
* Remember to add "data:image/png;base64," in front of the string.
*
* @method loadImage
* @param  {String} path Path of the image to be loaded
* @param  {function(p5.Image)} [successCallback] Function to be called once
*                                the image is loaded. Will be passed the
*                                <a href="#/p5.Image">p5.Image</a>.
* @param  {function(Event)}    [failureCallback] called with event error if
*                                the image fails to load.
* @return {p5.Image}             the <a href="#/p5.Image">p5.Image</a> object
* @example
* <div>
* <code>
* let img;
* function preload() {
*   img = loadImage('assets/laDefense.jpg');
* }
* function setup() {
*   image(img, 0, 0);
* }
* </code>
* </div>
* <div>
* <code>
* function setup() {
*   // here we use a callback to display the image after loading
*   loadImage('assets/laDefense.jpg', img => {
*     image(img, 0, 0);
*   });
* }
* </code>
* </div>
*
* @alt
* image of the underside of a white umbrella and grided ceililng above
* image of the underside of a white umbrella and grided ceililng above
*/
_main.default.prototype.loadImage = function(
    path,
    successCallback,
    failureCallback
) {
    _main.default._validateParameters('loadImage', arguments);
    var pImg = new _main.default.Image(1, 1, this);
    var self = this;

    var req = new Request(path, {
        method: 'GET',
        mode: 'cors'
    });

    fetch(path, req)
        .then(function(response) {
            // GIF section
            var contentType = response.headers.get('content-type');
            if (contentType === null) {
                console.warn(
                    'The image you loaded does not have a Content-Type header. If you are using the online editor consider reuploading the asset.'
                );
            }
            if (contentType && contentType.includes('image/gif')) {
                response.arrayBuffer().then(
                    function(arrayBuffer) {
                        if (arrayBuffer) {
                            var byteArray = new Uint8Array(arrayBuffer);
                            _createGif(
                                byteArray,
                                pImg,
                                successCallback,
                                failureCallback,
                                function(pImg) {
                                    self._decrementPreload();
                                }.bind(self)
                            );
                        }
                    },
                    function(e) {
                        if (typeof failureCallback === 'function') {
                            failureCallback(e);
                        } else {
                            console.error(e);
                        }
                    }
                );
            } else {
                // Non-GIF Section
                var img = new Image();

                img.onload = function() {
                    pImg.width = pImg.canvas.width = img.width;
                    pImg.height = pImg.canvas.height = img.height;

                    // Draw the image into the backing canvas of the p5.Image
                    pImg.drawingContext.drawImage(img, 0, 0);
                    pImg.modified = true;
                    if (typeof successCallback === 'function') {
                        successCallback(pImg);
                    }
                    self._decrementPreload();
                };

                img.onerror = function(e) {
                    _main.default._friendlyFileLoadError(0, img.src);
                    if (typeof failureCallback === 'function') {
                        failureCallback(e);
                    } else {
                        console.error(e);
                    }
                };

                // Set crossOrigin in case image is served with CORS headers.
                // This will let us draw to the canvas without tainting it.
                // See https://developer.mozilla.org/en-US/docs/HTML/CORS_Enabled_Image
                // When using data-uris the file will be loaded locally
                // so we don't need to worry about crossOrigin with base64 file types.
                if (path.indexOf('data:image/') !== 0) {
                    img.crossOrigin = 'Anonymous';
                }
                // start loading the image
                img.src = path;
            }
            pImg.modified = true;
        })
        .catch(function(e) {
            _main.default._friendlyFileLoadError(0, path);
            if (typeof failureCallback === 'function') {
                failureCallback(e);
            } else {
                console.error(e);
            }
        });
    return pImg;
};