class WaveNode extends AudioWorkletProcessor {
  constructor (context) {
    super(context, 'direct', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      channelCount: 1,
    });

    this._wave = [0];
    this._playback_index = 0;
    console.log('context', context);

    this.port.onmessage = event => {
      if (event.data.hasOwnProperty('wave')) {
        const wave = event.data.wave;
        for (let i = 0; i < wave.length; i++) {
          this._wave[i] = wave[i];
        }
      }
    }
    this.port.start();
  }

  process (inputs, outputs, parameters) {
    if (outputs[0].length > 0) {
      const channel = outputs[0][0];
      for (let i = 0; i < channel.length; i++) {
        channel[i] = this._wave[this._playback_index];
        this._playback_index += 1;
        this._playback_index %= this._wave.length;
      }
    }
    return true;
  }
}

registerProcessor('wave-node', WaveNode);
