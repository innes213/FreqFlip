/*
Mostly copied from http://jsfiddle.net/gaJyT/18/
*/
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
const CANVAS_HEIGHT = canvas.height;
const CANVAS_WIDTH = canvas.width;
const SPACER_WIDTH = 1;
const COL_WIDTH = 3;
const BUFFER_SIZE = 2048;
const COEFS = [1, 1, -1, -1];
var multiplier = [];

var context = new (window.AudioContext || window.webkitAudioContext)();
var source;
var processor;
var analyser;
var xhr;

function buildMultiplier() {
	while (multiplier.length < BUFFER_SIZE) {
		multiplier = multiplier.concat(COEFS);
	}
	console.log(multiplier);
}

function initAudio(data) {
	buildMultiplier();
	source = context.createBufferSource();

	if(context.decodeAudioData) {
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
	processor = context.createJavaScriptNode(BUFFER_SIZE /*bufferSize*/, 1 /*num inputs*/, 1 /*num outputs*/);
	processor.onaudioprocess = processAudio;

	analyser = context.createAnalyser();

	source.connect(context.destination);
	source.connect(analyser);

	analyser.connect(processor);
	processor.connect(context.destination);

	source.noteOn(0);
	setTimeout(disconnect, source.buffer.duration * 1000 +1000);
}

function disconnect() {
	source.noteOff(0);
	source.disconnect(0);
	processor.disconnect(0);
	analyser.disconnect(0);
}

function processAudio(e) {

	for (var i = 0; i < BUFFER_SIZE; i++) {
		processor.buffer[i] = processAudio(.buffer[i] * multiplier[i];
	}

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

function dropEvent(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var droppedFiles = evt.dataTransfer.files;

	/*
	 var formData = new FormData();

	 for(var i = 0; i < droppedFiles.length; ++i) {
	 var file = droppedFiles[i];

	 files.append(file.name, file);
	 }

	 xhr = new XMLHttpRequest();
	 xhr.open("POST", settings.url);
	 xhr.onreadystatechange = handleResult;
	 xhr.send(formData);
	 */

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