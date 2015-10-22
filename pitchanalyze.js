var buflen = 1024;
var isPlaying = false;
var timeToStartNextWave = 0;
var all_notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteFromPitch( frequency ) {
	var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
	return Math.round( noteNum ) + 69;
}



function GetRMS(bufferFreq){
	var rms=0;
	for (var i=0;i<buflen;i++) {
		var val = bufferFreq[i];
		rms += val*val;
	}
	rms = Math.sqrt(rms/buflen);
	return rms;
}

function GetPitchOfInputSoundUsingMax( bufferFreq, sampleRate ){
	//uses Max of fft as pitch
	var MAX_SAMPLES = Math.floor(buflen/2);
	
	var maxindex = 0;
	var max = 0;
	for (var i = 0; i<buflen; i++){
		var currentAbs = Math.abs(bufferFreq[i]);	
		if (currentAbs>max){
			max = currentAbs;
			maxindex = i;
		}
	}
	document.getElementById("maxindex").textContent = "maxindex= " + maxindex;


	return maxindex * (sampleRate/2) / buflen;

}

function GetPeaks(arr){
	var argpeaks = [];

	for (var i=2; i<arr.length-2; i++){
		if (arr[i]>=arr[i-1] && arr[i]>=arr[i-2] &&
			arr[i]>=arr[i+1] && arr[i]>=arr[i+2]){
			argpeaks.push(i);
	}

}
return argpeaks;
}

//read http://arxiv.org/pdf/1107.4969.pdf

function add(a, b) {
	return a + b;
}

function PrintArray(a,b){
	return a + ", " + b.toString();
}

function arrayMinExcludingZeros(arr) {
	var len = arr.length;
	var min = Infinity;
	var argmin;
	while (len--) {
		if (arr[len] < min && arr[len]>0) {
			min = arr[len];
			argmin = len;
		}
	}
	return argmin;
};

function GetPitchOfInputSoundUsingHarmonicity( bufferFreq, sampleRate ){
	var argpeaks = GetPeaks(bufferFreq);
	
	document.getElementById("argpeaks").textContent = "argpeaks= " + argpeaks;


	var pitches;
	var globalerr = [];//new Float32Array(argpeaks.length);
	for (var i = 0; i<argpeaks.length; i++){

		var FundFreqCand = argpeaks[i];
		var overtones = new Uint16Array(argpeaks.length-i);
		var errors = new Float32Array(argpeaks.length-i);
		for (var j= i + 1; j < argpeaks.length; j++){
			overtones[j] = argpeaks[i-j];
			errors[j] = Math.abs(overtones[j] - (j-i+1) * FundFreqCand);
		}
		globalerr.push( errors.reduce(add,0));
	}

	//return freq corresponding to minimal globalerr
	var minErrorIndex = arrayMinExcludingZeros(globalerr);

	document.getElementById("globalerr").textContent = "globalerr= " + globalerr.reduce(PrintArray,"");
	document.getElementById("minErrorIndex").textContent = "minErrorIndex= " + minErrorIndex;
	document.getElementById("fundFreq").textContent = "fundFreq= " + argpeaks[minErrorIndex];

	return argpeaks[minErrorIndex] * (sampleRate/2) / bufferFreq.length;

}


function autoCorrelate( buf, sampleRate ) {
	var SIZE = buf.length;
	var MAX_SAMPLES = Math.floor(SIZE/2);
	var MIN_SAMPLES = 4;
	var best_offset = -1;
	var best_correlation = 0;
	var rms = 0;
	var foundGoodCorrelation = false;
	var correlations = new Array(MAX_SAMPLES);

	for (var i=0;i<SIZE;i++) {
		var val = buf[i];
		rms += val*val;
	}
	rms = Math.sqrt(rms/SIZE);
	if (rms<0.01) // not enough signal
		return -1;

	var lastCorrelation=1;
	for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
		var correlation = 0;

		for (var i=0; i<MAX_SAMPLES; i++) {
			correlation += Math.abs((buf[i])-(buf[i+offset]));
		}
		correlation = 1 - (correlation/MAX_SAMPLES);
		correlations[offset] = correlation; // store it, for the tweaking we need to do below.
		if ((correlation>0.9) && (correlation > lastCorrelation)) {
			foundGoodCorrelation = true;
			if (correlation > best_correlation) {
				best_correlation = correlation;
				best_offset = offset;
			}
		} else if (foundGoodCorrelation) {
			// short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
			// Now we need to tweak the offset - by interpolating between the values to the left and right of the
			// best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
			// we need to do a curve fit on correlations[] around best_offset in order to better determine precise
			// (anti-aliased) offset.

			// we know best_offset >=1, 
			// since foundGoodCorrelation cannot go to true until the second pass (offset=1), and 
			// we can't drop into this clause until the following pass (else if).
			var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];  
			return sampleRate/(best_offset+(8*shift));
		}
		lastCorrelation = correlation;
	}
	if (best_correlation > 0.01) {
		// console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
		return sampleRate/best_offset;
	}
	return -1;
//	var best_frequency = sampleRate/best_offset;
}

function GetPitchOfInputSound( bufferTime, sampleRate ){
	//auto correlation
	var lastCorrelation = 1;
	var maxSamples = bufferTime.length/2;
	var best_correlation = 0;
	var best_offset = -1;
	var correlations = new Array(maxSamples);
	var foundGoodCorrelation = false;
	
	for (var offset = 4; offset < maxSamples; offset++) {
		var diffs = 0;

		for (var i = 0; i < maxSamples; i++) {
			diffs += Math.abs((bufferTime[i])-(bufferTime[i+offset]));
		}
		var correlation = 1 - (diffs / maxSamples);
		correlations[offset] = correlation; // store it, for the tweaking we need to do below.
		if ((correlation>0.01) && 
			(correlation > lastCorrelation)) {
			foundGoodCorrelation = true;
		if (correlation > best_correlation) {
			best_correlation = correlation;
			best_offset = offset;
		}
	} else if (foundGoodCorrelation) {
		var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];  
		return sampleRate/(best_offset+(8*shift));
	}
	lastCorrelation = correlation;
}
if (best_correlation > 0.01) {
	document.getElementById("best_offset").textContent = "best offset= " + best_offset;
	return sampleRate/best_offset;
}
else{
	return -1;	
}


}


function LaunchSineWave(pitch){
	if (audioContext.currentTime > timeToStartNextWave){
		isPlaying = false;
	}

	if (isPlaying === false && pitch>200) {
		var osc = audioContext.createOscillator();
		osc.frequency.value = pitch;
		osc.type = "sawtooth";

		var gainNode = audioContext.createGain();
		gainNode.gain.value = 0.7;

		var biquadFilter = audioContext.createBiquadFilter();
		biquadFilter.type = "lowpass";
		biquadFilter.frequency.value = 800;

		osc.connect(biquadFilter);
		biquadFilter.connect(gainNode);
		gainNode.connect(audioContext.destination);
		//osc.connect(audioContext.destination);
		timeToStartNextWave = audioContext.currentTime + 1;
		osc.start(audioContext.currentTime);
		osc.stop(timeToStartNextWave);


		isPlaying = true;
	}

}

function updatePitch(time){
	var cycles = new Array;
	//FreqData defined in draw.js as global variable
	//FreqData = new Uint8Array(buflen);
	var timeData = new Uint8Array(buflen);
	var pitch;

	analyser.getByteTimeDomainData(timeData);
	analyser.getByteFrequencyData(FreqData);
	
	var rms = GetRMS(FreqData);
	if (rms>30) { //enough signal
		pitch = GetPitchOfInputSound( timeData, audioContext.sampleRate );
		//pitch = autoCorrelate(timeData, audioContext.samplerate);
		LaunchSineWave(pitch);

	}

	//debug zone
	var note =  noteFromPitch( pitch );
	document.getElementById("note").textContent = all_notes[note%12];;
	document.getElementById("rms").textContent = "rms= " + rms;
	document.getElementById("samplerate").textContent = "sample rate= " + audioContext.sampleRate;
	document.getElementById("pitch").textContent = "pitch= " + pitch;
	document.getElementById("buflen").textContent = "buflen= " + buflen;


	if (!window.requestAnimationFrame){
		window.requestAnimationFrame = window.webkitRequestAnimationFrame;
	}		
	rafID = window.requestAnimationFrame( updatePitch );

}