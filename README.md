# FreqFlip

This shifts the spectrom of an audio signal by half the sampling frequency, effectively flipping the spectrum using a nifty time-domain trick..

Currently hosted here:

The code started as a fork from this jsFiddle: http://jsfiddle.net/gaJyT/18/ which (once updated) played an mp3 the user dragged and dropped and displayed the spectrum.

I added the signal processing, re-ordered the audio graph and used animation to show the spectrum.

## How to run

Just clone it and run `python -m SimpleHTTPServer 8000` from the `web` directory. Then browse to http://localhost:8000

## How it works

This was inspired by an interview question I got years ago at Dolby. "What happens if you multiply every other sample of a time-domain signal by -1?" Here's a had-wavey explaination.
By doing this, you are effectively multiplying by the critical frequency (fs/2). Multiplying in the time domain results in convolving in the frewquency domain. Multiplying by a sine of frequency f results in a shift in the spectrum by f.
Now remember from sampling theory that multiplying a continuous signal by a pulse train with frequency fs (the sample frequency), results in a discrete signal. Taking the discrete Fourier transform (DFT) of that signal yields a spectrum from -fs/2 to fs/2 which is reflected about the y-axis. This spectrum is repeated every fs, but let's just think abot the spectrum from -fs/2 to fs/2. In this code we are effectively multiplying our singal by fs/2. Therefore we are shifting the spectrum fs/2, yielding the the spectrum that originally contained -fs/2 to 0.

For detailed amath and pictures, see https://en.wikipedia.org/wiki/Nyquist%E2%80%93Shannon_sampling_theorem.
