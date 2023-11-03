<template>
  <canvas ref="bjsCanvas" id="renderCanvas" />
</template>

<script>
import { ref, onMounted } from "@vue/runtime-core";
// demo 1

// import { createScene } from "@/scenes/demo/MyFirstScene";
// demo 2

import { initializeBabylonApp } from "@/scenes/spacepirates/index";
export default {
  name: "BabylonScene",
  setup() {
    const bjsCanvas = ref(null);//指向模板中的 canvas 元素
    onMounted(() => {
      if (bjsCanvas.value) {
        // demo1
        // createScene(bjsCanvas.value);
        // demo2
        initializeBabylonApp({ canvas: bjsCanvas.value, assetsHostUrl: "" })
      }
    });

    return {
      bjsCanvas,
    };
  },
};

</script>

<style scoped></style>
