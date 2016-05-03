/*
Initially forked from http://jsfiddle.net/gaJyT/18/
*/
var inCanvas = document.getElementById('inputSpectrum');
var outCanvas = document.getElementById('outputSpectrum');
var inCtx = inCanvas.getContext('2d');
var outCtx = outCanvas.getContext('2d');
const CANVAS_HEIGHT = outCanvas.height;
const CANVAS_WIDTH = outCanvas.width;

const FFT_SIZE = 256; // Must be power of 2
const NUM_BANDS = 64; // Must be integer factor of FFT_SIZE/2
const COL_WIDTH = CANVAS_WIDTH / NUM_BANDS;
const BUFFER_LENGTH = 2048;

var context;
var source;
var processor;
var inAnalyser;
var outAnalyser;
var xhr;

var multiplier = [];

function buildMultiplier() {
	var i = 1;
	while (multiplier.length < BUFFER_LENGTH) {
		multiplier.push(i);
		i = i * -1;
	}
}

function initAudio(data) {
	console.log("Initializing audio context and source");
	context = new (window.AudioContext || window.webkitAudioContext)();
	if (context == null) {
		console.error("No Audio Context Created!");
		window.alert("Web Audio not supported by this browser");
		return;
	}
	source = context.createBufferSource();
	buildMultiplier();
	if (context.decodeAudioData) {
		context.decodeAudioData(data, function(buffer) {
			source.buffer = buffer;
			createAudio();
		}, function(e) {
			console.log(e);
		});
	} else {
		source.buffer = context.createBuffer(data, false /*mixToMono*/);
		createAudio();
	}
}

function createAudio() {
	console.log("Boulding audio graph");
	processor = context.createScriptProcessor(BUFFER_LENGTH, 1, 1);
	processor.onaudioprocess = freqflipProcess;
	inAnalyser = context.createAnalyser();
	inAnalyser.fftSize = FFT_SIZE;
	outAnalyser = context.createAnalyser();
	outAnalyser.fftSize = FFT_SIZE;

	source.connect(processor);
	source.connect(inAnalyser);
	processor.connect(outAnalyser);
	processor.connect(context.destination);

	console.log("Starting playback");
	source.start(0);
	setTimeout(disconnect, source.buffer.duration * 1000 +1000);
	updateAnimation(0);
}

function freqflipProcess(e) {
	var inBuff = e.inputBuffer;
	var outBuff = e.outputBuffer;

	for (var channel = outBuff.numberOfChannels-1; channel >= 0; channel--) {
		var input = inBuff.getChannelData(channel);
		var output = outBuff.getChannelData(channel);
		for (var n = BUFFER_LENGTH-1; n >= 0; n-- ) {
			output[n] = input[n] * multiplier[n];
			//output[n] = input[n] * -1;
		}
	}
}

function disconnect() {
	console.log("Shutting graph down");
	source.stop(0);
	source.disconnect(0);
	processor.disconnect(0);
	inAnalyser.disconnect(0);
	outAnalyser.disconnect(0);
}

function showSpectrum(ctx, freqByteData) {
	ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	var binsPerBand = freqByteData.length / NUM_BANDS;
	var scale = CANVAS_HEIGHT / 255;

	// Draw rectangle for each frequency bin.
	for (var i = 0; i < NUM_BANDS; i++) {
		// Get the average magnitude for the bins in a band
		var magnitude = 0;
		var offset = Math.floor(i * binsPerBand);
		for (var j = 0; j < binsPerBand; j++) {
			magnitude += freqByteData[offset + j];
		}
		magnitude = scale * magnitude / binsPerBand;
		ctx.fillStyle = "hsl( " + Math.round((i * 360) / NUM_BANDS) + ", 100%, 50%)";
		ctx.fillRect(i * COL_WIDTH, CANVAS_HEIGHT, COL_WIDTH, -magnitude);
	}
}

function updateAnimation(time){

	var rAF = window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.msRequestAnimationFrame;
	rAF( updateAnimation );

	// Place all animation functions here
	// Update meters
	var freqByteData = new Uint8Array(inAnalyser.frequencyBinCount);
	inAnalyser.getByteFrequencyData(freqByteData);
	showSpectrum(inCtx, freqByteData);
	outAnalyser.getByteFrequencyData(freqByteData);
	showSpectrum(outCtx, freqByteData);
}

function dropEvent(evt) {
	console.log("File dropped");
	evt.stopPropagation();
	evt.preventDefault();

	var droppedFiles = evt.dataTransfer.files;
	var reader = new FileReader();

	reader.onload = function(fileEvent) {
		var data = fileEvent.target.result;
		initAudio(data);
	}

	reader.readAsArrayBuffer(droppedFiles[0]);
}

function handleResult() {
	if (xhr.readyState == 4 /* complete */) {
		switch(xhr.status) {
			case 200: /* Success */
				initAudio(request.response);
				break;
			default:
				break;
		}
		xhr = null;
	}
}

function dragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	return false;
}

var dropArea = document.getElementById('dropArea');
dropArea.addEventListener('drop', dropEvent, false);
dropArea.addEventListener('dragover', dragOver, false);