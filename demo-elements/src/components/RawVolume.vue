<template>
  <div class="raw-volume">
    <p>file: {{ file }}</p>
    <p>data: {{ count }}</p>
    <div class="boxes">
      <div class="box" :style="{'background': `hsla(0, 0%, ${amp}%)`}"></div>
      <div class="bar" :style="{'height': `${amp}%`}"></div>
    </div>
    <audio controls ref="track" :src="`/demo-elements/public/${file}`"></audio>
    <button v-on:click="play">play</button>
  </div>
</template>

<script>

async function initAudio(ctx, trackEl, workletModule) {
  await ctx.audioWorklet.addModule(workletModule);
  const rawNode = new AudioWorkletNode(ctx, "raw");

  const track = ctx.createMediaElementSource(trackEl);
  track.connect(ctx.destination);
  track.connect(rawNode);

  await ctx.resume();

  return rawNode;
}

export default {
  props: ['file', 'worklet'],
  data: () => ({
    ctx: null,
    count: 2,
    sums: [],
    lastFrameTime: 0,
    amp: 0,
    scale: 16,
  }),
  methods: {
    play() {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.$refs.track.play();
    },
    handleMessage(m) {
      this.sums.push(m.data.sum);
    },
    anim(t) {
      const dt = t - this.lastFrameTime;
      this.lastFrameTime = t;
      if (this.sums.length === 0) {
        this.amp = 0;
      } else {
        const total = this.sums.reduce((a, b) => a + b, 0);
        this.amp = total / dt * this.scale;
        this.sums = [];
      }
      // console.log(t, dt, this.amp);
      requestAnimationFrame(this.anim);
    }
  },
  async mounted() {
    this.ctx = new AudioContext();
    const trackEl = this.$refs.track;

    console.log('wk', this.$props);
    const rawNode = await initAudio(this.ctx, trackEl, this.worklet);

    rawNode.port.onmessage = this.handleMessage;
    requestAnimationFrame(this.anim);
  }
};
</script>

<style>
  .raw-volume {
    background: #000;
    padding: 1em;
  }
  .raw-volume p {
    font-family: sans-serif;
  }
  .boxes {
    display: flex;
    align-items: flex-end;
    height: 200px;
  }
  .box {
    height: 100%;
    width: 200px;
  }
  .bar {
    background: #ccc;
    height: 0;
    width: 12px;
  }
</style>
