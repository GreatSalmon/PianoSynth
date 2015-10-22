var FreqData;

function testFFTplot(x) {
	return Math.abs( 200*Math.sin( x / 20 ));
}



function decibelsToLinear(decibels){
    return powf(10, 0.05 * decibels);
}

function mainDraw(canv,cmd){
	
	requestAnimationFrame(function() { mainDraw(canv,cmd) });

	var drawcontext = canv.getContext("2d");
	var bufferLength = analyser.frequencyBinCount;

	FreqData = new Uint8Array(bufferLength);


	var WIDTH = canv.width;// * 0.8;
	var HEIGHT = canv.height;// * 0.8;
	drawcontext.fillStyle = 'rgb(200, 200, 200)';
	drawcontext.fillRect(0, 0, WIDTH, HEIGHT);
	
	drawcontext.lineWidth = 2;
	drawcontext.strokeStyle = 'rgb(0, 0, 0)';
	drawcontext.beginPath();

	if (cmd === "time"){
		analyser.getByteTimeDomainData(FreqData);	

		var sliceWidth = WIDTH * 1.0 / bufferLength;
		var x = 0;
		for(var i = 0; i < bufferLength; i++) {
			var v = FreqData[i] / 128.0;
			var y = v * HEIGHT/2;
			if(i === 0) {
				drawcontext.moveTo(x, y);
			}
			else {
				drawcontext.lineTo(x, y);
			}
			x += sliceWidth;
		}
	}
	else{
		analyser.getByteFrequencyData(FreqData);	
		//test
		//for (var i =0; i<dataArray.length; i++){
		//	dataArray[i] = testFFTplot(i);
		//}


		var barWidth = (WIDTH / bufferLength) * 2.5;
		var barHeight;
		var x = 0;

		var maxFFT = Math.max.apply(null, FreqData);
		var minFFT = Math.min.apply(null, FreqData);
		var maxindex = FreqData.indexOf(maxFFT);

		document.getElementById("maxFFT").textContent = "maxFFT= " + maxFFT;
		document.getElementById("minFFT").textContent = "minFFT= " + minFFT;

		var maxfreq = maxindex*(audioContext.sampleRate/2)/255;

		document.getElementById("maxfreq").textContent = "maxfreq= " + maxfreq;

		for(var i = 0; i < bufferLength; i++) {
			barHeight = FreqData[i];

			drawcontext.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';

			drawcontext.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

			x += barWidth + 1;
			
		}
		
	}
	
	
	drawcontext.stroke();
}
