<script setup lang="ts">
import {ref,onMounted} from '@vue/runtime-core';
import { initializeBabylonApp } from "@/sences/playgroundRunner.js";

defineProps<{ msg: string }>()
const bjsCanvas = ref(null);//指向模板中的 canvas 元素
onMounted(() => {
  if (bjsCanvas.value) {
    initializeBabylonApp({canvas:bjsCanvas.value,assetsHostUrl:""})
  }
});
</script>

<template>
  <canvas ref="bjsCanvas" id="renderCanvas"></canvas>
</template>

<style scoped>
</style>
