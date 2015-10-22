function getUserMedia(dictionary, callback, error) {
    try {
        navigator.getUserMedia = 
        	navigator.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

function hasGetUserMedia() {
	return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

//var canvas = $('#timeCanvas')[0];

//ctx.fillStyle="#FF00F0";
//ctx.fillRect(0, 0, canvas.width, canvas.height);
var analyser;
var audioContext;

function startPlots(){

	var timecanvas = document.getElementById("timeCanvas");
	mainDraw( timecanvas,"time" );
	var freqcanvas = document.getElementById("freqCanvas");
	mainDraw(freqcanvas,"frequency" );

}

function gotMicStream(stream){
	audioContext = new AudioContext();
	var mediaStreamSource = audioContext.createMediaStreamSource(stream);
	window.source = mediaStreamSource;

	analyser = audioContext.createAnalyser();
	mediaStreamSource.connect( analyser );
	analyser.fftSize = 2048;

	startPlots();

	updatePitch();
}

function errorGettingStream(){
	alert("error!");
}


// main


var constraints = {
        "audio": {
            "mandatory": {
                "googEchoCancellation": "false",
                "googAutoGainControl": "false",
                "googNoiseSuppression": "false",
                "googHighpassFilter": "false"
            },
            "optional": []
        },
    };
getUserMedia(constraints, gotMicStream, errorGettingStream);


