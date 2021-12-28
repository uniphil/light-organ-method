<template>
  <div class="raw-volume">
    <h2>sup</h2>
    <p>file: {{ file }}</p>
  </div>
</template>

<script>
  export default {
    props: ['file']
  }
</script>

<style>
  .raw-volume p {
    font-family: sans-serif;
  }
</style>
