var targetResolutionScale = 1.0; // for screenshots with higher resolution set to 2.0 or even 3.0

var timeout = 10000; // in ms

var scene = viewer.scene;

if (!scene) {

    console.error('No scene');

}

// define callback functions

var prepareScreenshot = function () {

    var canvas = scene.canvas;

    viewer.resolutionScale = targetResolutionScale;

    scene.preRender.removeEventListener(prepareScreenshot);

    // take snapshot after defined timeout to allow scene update (ie. loading data)

    setTimeout(function () {

        scene.postRender.addEventListener(takeScreenshot);

    }, timeout);

}

var takeScreenshot = function () {

    scene.postRender.removeEventListener(takeScreenshot);

    var canvas = scene.canvas;

    canvas.toBlob(function (blob) {

        var url = URL.createObjectURL(blob);

        downloadURI(url, "snapshot - "+targetResolutionScale.toString() + "x.png");

        // reset resolutionScale

        viewer.resolutionScale = 1.0;

    });

}

scene.preRender.addEventListener(prepareScreenshot);

function downloadURI(uri, name) {

    var link = document.createElement("a");

    link.download = name;

    link.href = uri;

    // mimic click on “download button”

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    delete link;

}