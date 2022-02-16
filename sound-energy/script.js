

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx;
var channels = 1;
async function audioInit() {
  audioCtx = new AudioContext();
  await audioCtx.audioWorklet.addModule('wave-node.js');
}

var sound = (function() {
  var triangle = document.querySelector('button.triangle');
  var square = document.querySelector('button.square');
  var shift = document.querySelector('button.shift');
  var shuffle = document.querySelector('button.shuffle');
  var reset = document.querySelector('button.reset');
  var play = document.querySelector('button.play');
  var stop = document.querySelector('button.stop');
  var canvas = document.querySelector('canvas.wave');
  var width = canvas.width;
  var height = canvas.height;
  var ctx = canvas.getContext('2d');
  var wave = ctx.createImageData(width, height);

// 2
// 52 / 27
// 6554 / 3375
// 2241272 / 1157625
// 60600094 / 31255875
// 80596213364 / 41601569625
// 177153083899958 / 91398648466125
// 177098921737904 / 91398648466125
// 870269799795254602 / 449041559914072125
// 5968282473675823170868 / 3079976059450620705375

  //  1 1.00000 81%   h1
  //  2 1.11111 90%   h3
  //  3 1.15111 93%   h5
  //  4 1.17512 95%   h7
  //  5 1.18386 96%   h9
  //  6 1.19213 97%   h11
  //  7 1.19805 97%   h13
  //  8 1.20249 97%   h15
  //  9 1.20595 98%   h17
  // 10 1.20872 98%   h19
  // 11 1.21099 98%   h21
  // 12 1.21288 98%   h23
  // 13 1.21448 98%   h25
  // 14 1.21585 99%   h27
  // 15 1.21704 99%   h29
  // 16 1.21808 99%   h31
  // 17 1.21900 99%   h33
  // 18 1.21982 99%   h35
  // 19 1.22055 99%   h37
  // 20 1.22120 99%   h39
  // 21 1.22180 99%   h41
  // 1000 1.23345

  var freq = 220; // Hz
  var harmonics = 21;
  var phases = [];
  var shape;
  var lt = 0;
  var shifting = false;
  var wave_node;
  reset_wave('triangle');
  draw_wave(1);

  function reset_wave(s) {
    shape = s;
    for (var i = 0; i < harmonics; i++) {
      phases[i] = {
        triangle: i % 2 ? Math.PI : 0,
        square: 0,
      }[shape];
    }
    wave_dirty = true;
  }

  function value_at(theta_0) {
    var sig = 0;
    for (var p = 0; p < harmonics; p++) {
      var phase = phases[p];
      var overtone = (p+1) * 2 - 1;
      var theta = theta_0 * (overtone-0) + phase;
      sig += {
        triangle: Math.sin(theta) / Math.pow(overtone, 2),
        square: Math.sin(theta) / overtone,
      }[shape];
    }
    return sig;
  }

  function to_y(v) {
    return -v * height / 6 + height / 2;
  }

  function draw_wave(t) {
    var peak_abs = 0;
    var abs_sum = 0;
    var squared_sum = 0;
    for (var x = 0; x < width; x++) {
      var theta = x * 4 * Math.PI / width;
      var sig = value_at(theta);
      var abs = Math.abs(sig)
      abs_sum += abs;
      peak_abs = Math.max(peak_abs, abs);
      squared_sum += Math.pow(sig, 2);
      var sig_y = to_y(sig);
      for (var y = 0; y < height; y++) {
        var px_idx = (y * width + x) * 4;
        var distance = Math.abs(y - sig_y);
        var pb = distance > 3
          ? 0
          : 255 * (distance < 2
            ? 1
            : 1 - (distance - 2) / 1);
          wave.data[px_idx+0] = pb;
          wave.data[px_idx+1] = pb/2;
          wave.data[px_idx+2] = pb;
          wave.data[px_idx+3] = 255;
      }
    }

    var mean_abs_sum = abs_sum / width;
    var mean_squared_sum = squared_sum / width;
    var rms = Math.sqrt(mean_squared_sum);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.putImageData(wave, 0, 0);
    ctx.setLineDash([1, 2]);

    // peak
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.strokeStyle = '#fc0';
    ctx.moveTo(0, Math.round(to_y(peak_abs)));
    ctx.lineTo(width, Math.round(to_y(peak_abs)));
    ctx.moveTo(0, Math.round(to_y(-peak_abs)));
    ctx.lineTo(width, Math.round(to_y(-peak_abs)));
    ctx.stroke();

    // avg
    ctx.fillStyle = '#ff55ff29';
    ctx.fillRect(0, to_y(mean_abs_sum), width, height - 2 * to_y(mean_abs_sum));

    // zero
    ctx.beginPath();
    ctx.setLineDash([1, 1]);
    ctx.strokeStyle = '#888f';
    ctx.moveTo(0, to_y(0));
    ctx.lineTo(width, to_y(0));
    ctx.stroke();

    // rms
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.strokeStyle = '#0cfc';
    ctx.moveTo(0, to_y(rms));
    ctx.lineTo(width, to_y(rms));
    ctx.moveTo(0, to_y(-rms));
    ctx.lineTo(width, to_y(-rms));
    ctx.stroke();

    ctx.font = '21px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fc0';
    ctx.fillText('peak_abs(y): ' + peak_abs.toFixed(5), width - 4, 23);
    ctx.fillStyle = '#9f0';
    ctx.fillText('avg_abs(y): ' + mean_abs_sum.toFixed(5), width - 4, 50);
    ctx.fillStyle = '#0cf';
    ctx.fillText('rms(y): ' + rms.toFixed(5), width - 4, 75);

    if (shifting) {
      var dt = t - lt;
      for (var p = 1; p < harmonics; p++) {
        var s = [1, -1, 1, -1, 1, -1];
        var d = [41, 73, 79, 53, 43, 61, 47, 67, 71, 59];
        var ch = s[p % s.length] * d[p % d.length];
        phases[p] += 1 * ch / 4000;
      }
      wave_dirty = true;
    }
    lt = t;
    requestAnimationFrame(draw_wave);
    if (wave_dirty) update_audio_wave();
  }

  triangle.onclick = function() {
    reset_wave('triangle');
  }

  square.onclick = function() {
    reset_wave('square');
  }

  shift.onclick = function() {
    shifting = !shifting;
  }

  shuffle.onclick = function() {
    for (var i = 1; i < harmonics; i++) {
      phases[i] = Math.random() * Math.PI * 2;
    }
    wave_dirty = true;
  }

  reset.onclick = function() {
    reset_wave(shape);
  }

  var source;
  var rate;
  var n_samples;
  // var frames;
  function update_audio_wave() {
    wave_dirty = false;
    if (!audioCtx) return;
    var buf = [];
    for (var i = 0; i < n_samples; i++) {
      buf[i] = value_at(i * 4 * Math.PI / n_samples);
    }
    wave_node.port.postMessage({ wave: buf });
  }

  play.onclick = async function() {
    if(!audioCtx) {
      await audioInit();
    }
    console.log('wn', wave_node);
    if (!wave_node) {
      wave_node = new AudioWorkletNode(audioCtx, 'wave-node');
    }

    rate = audioCtx.sampleRate;
    n_samples = Math.round(2 * rate / freq);
    update_audio_wave();

    wave_node.connect(audioCtx.destination);
  }

  stop.onclick = function() {
    wave_node.disconnect();
  }


})();
