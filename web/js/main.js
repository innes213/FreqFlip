/*
Initially forked from http://jsfiddle.net/gaJyT/18/
*/
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
const CANVAS_HEIGHT = canvas.height;
const CANVAS_WIDTH = canvas.width;
const SPACER_WIDTH = 1;
const COL_WIDTH = 3;
const BUFFER_LENGTH = 2048;

var context = new (window.AudioContext || window.webkitAudioContext)();
var source;
var processor;
var analyser;
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
	console.log("Initializing audio source");
	buildMultiplier();
	source = context.createBufferSource();

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
	analyser = context.createAnalyser();
	analyser.fftSize = 256;

	source.connect(processor);
	processor.connect(analyser);
	processor.connect(context.destination);

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
	source.stop(0);
	source.disconnect(0);
	processor.disconnect(0);
	analyser.disconnect(0);
}



function showSpectrum() {
	var freqByteData = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(freqByteData);

	ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

	var colors = [
		'#3369E8', // blue
		'#D53225', // red
		'#EEB211', // yellow
		'#009939' // green
	];

	for (var i = 0; i < freqByteData.length; ++i) {

		var magnitude = freqByteData[i];
		var lingrad = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT - magnitude);

		lingrad.addColorStop(0, colors[i % colors.length]);
		lingrad.addColorStop(1, colors[i % colors.length]);
		ctx.fillStyle = lingrad;

		ctx.fillRect(i * SPACER_WIDTH, CANVAS_HEIGHT, COL_WIDTH, -magnitude);
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
	showSpectrum();
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