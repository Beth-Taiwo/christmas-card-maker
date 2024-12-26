<template>
  <div class="flex justify-center h-screen items-start bg-gray-100 pt-20">
    <div class="border p-8 w-96 bg-white flex flex-col gap-8">
      <h1 class="text-xl font-medium">Christmas Greeting Card Maker</h1>
      <div class="border aspect-square banner-here relative" v-html="svg"></div>
      <form class="flex flex-col gap-4">
        <input
          type="text"
          v-model="form.name"
          class="px-4 py-1 border w-full"
          placeholder="Enter name"
        />
        <input
          type="text"
          v-model="form.greeting"
          class="px-4 py-1 border w-full"
          placeholder="Enter greeting"
        />

        <select v-model="selectedFont" class="px-4 py-1 border w-full">
          <option value="">Select a font</option>
          <option v-for="font in fonts" :key="font" :value="font">
            {{ formatString(font.url) }}
          </option>
        </select>
        <input
          type="file"
          accept=".png, .jpg, .jpeg"
          @change="handleFileChange"
          class="px-4 py-1 border w-full"
        />
        <small class="text-gray-400"
          >Must be an image below 100kb, png, jpeg, or jpg formats only.</small
        >
        <button
          class="bg-indigo-500 text-white px-4 py-2"
          @click.prevent="downloadSvgAsJpeg(svg)"
        >
          Download
        </button>
      </form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { createSSRApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import { useLocalStorage } from "@vueuse/core";
import satori from "satori";
import { html } from "satori-html";
import ChristmasCard from "./components/ChristmasCard.vue";

const form = useLocalStorage("app-form", {
  name: "",
  greeting: "Merry Christmas",
  photo: null,
});
const svg = ref("");
const fonts = ref([]);
const selectedFont = ref<any>();

onMounted(async () => {
  await fetchFonts();
  refreshGraphics();
});

watch(
  form,
  async () => {
    await refreshGraphics();
  },
  { deep: true }
);

watch(selectedFont, async () => {
  await refreshGraphics();
});

watch(
  fonts,
  () => {
    selectedFont.value = fonts.value[10];
  },
  { immediate: true }
);

async function loadFonts(fonts) {
  return Promise.all(
    fonts.map(async (font) => ({
      ...font,
      data: await (await fetch(font.url)).arrayBuffer(),
    }))
  );
}

async function refreshGraphics() {
  const content = await renderToHTML(ChristmasCard, form.value);
  const markup = html(content);
  svg.value = await satori(markup, {
    width: 1080,
    height: 1080,
    fonts: [selectedFont.value],
  });
}

async function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement)?.files?.[0];
  if (file && file.size > 100 * 1024)
    throw new Error("File size must be below 100kb");
  const reader = new FileReader();
  reader.onload = () => (form.value.photo = reader.result as string);
  reader.readAsDataURL(file);
}

async function renderToHTML(Component, props = {}) {
  return await renderToString(createSSRApp(Component, props));
}
function downloadSvgAsJpeg(svgString, filename = "image.jpeg") {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1080;
    canvas.getContext("2d")?.drawImage(img, 0, 0, 1080, 1080);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/jpeg");
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

async function fetchFonts() {
  try {
    const response = await fetch("/api/available-fonts");
    const data = await response.json();
    fonts.value = await loadFonts(
      data.map((font) => ({
        name: "InstrumentSans",
        url: `/fonts/${font}`,
      }))
    );
  } catch (error) {
    console.error("Error fetching fonts:", error);
  }
}

function formatString(string: string) {
  return string.replace("/fonts/", "");
}
</script>
<style>
.banner-here svg {
  width: 100%;
  height: 100%;
}
</style>
