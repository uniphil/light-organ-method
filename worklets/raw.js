class RawAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    console.log('supppp');
    super();
    // this.port.postMessage('hello!');
    // this.port.onmessage = e => {
    //   console.log(e.data);
    //   this.port.postMessage('hihi');
    // };
  }

  process(inputList, outputList, parameters) {
    if (inputList[0].length >= 1) {
      const channel = inputList[0][2];
      let sum = 0;
      for (let i = 0; i < channel.length; i++) {
        sum += Math.abs(channel[i]);
      }
      this.port.postMessage({ sum });
    }

    // this.port.postMessage(inputList[0].length);
    // console.log(inputList[0].length);
    // if (inputList[0][0]) {
    //   console.log(inputList[0][0][0]);
    // }
    return true;
  }
}

registerProcessor("raw", RawAudioProcessor);
