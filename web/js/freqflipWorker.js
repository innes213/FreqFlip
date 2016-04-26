/*
For use with AudioWorkerNode when supported by Chrome
*/

var STATE_SILENCE = 0;
var STATE_WAITING_FOR_FIRST_FRAME = 1;
var STATE_PROCESSING = 2;

this.onaudionodecreated = function (event) {
	var node = event.node;
	var data = event.data;
	var phase = 0;
	var startTime = 0;
	var state = STATE_SILENCE;
	var num_chans = event.cha
	var multiplier = 1;
	console.log(event);

	function process(frame) {
		for (var i = 0; i < frame.length / NUM_CHANs; i++) {
			for (var j = 0; j < NUM_CHANs; j++) {
				var index = NUM_CHANs * i + J;
				frame[index] = frame[index] * multiplier;
			}
			multiplier = multiplier * -1;
		}
	}

	node.onaudioprocess = function (event) {
		var frame = event.outputBuffers[0];
		var frequency = event.parameters.frequency;
		var sampleRate = event.sampleRate;

		switch (state) {
			case STATE_SILENCE:
				break;
			case STATE_WAITING_FOR_FIRST_FRAME:
				var startIndex = Math.floor(startTime * sampleRate);
				var frameIndex = Math.floor(event.playbackTime * sampleRate);
				if (startIndex >= frameIndex + frame.length) {
					return;
				}

				var firstIndex = startIndex - frameIndex;
				process(frame.subarray(firstIndex), frequency.subarray(firstIndex), sampleRate);
				break;
			case STATE_PROCESSING:
				process(frame, frequency, sampleRate);
				break;
		}
	};

	node.onmessage = function (event) {
		switch (event.type) {
			case "start":
				startTime = event.data.time;
				break;
		}
	};
}