<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let src: string;
  export let onEnded: () => void = () => {};
  let className = '';
  export { className as class };

  let canvas: HTMLCanvasElement;
  let video: HTMLVideoElement;
  let rafId: number;

  onMount(() => {
    video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('disableremoteplayback', '');

    const ctx = canvas.getContext('2d')!;

    function draw() {
      if (video.readyState >= 2) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0);
      }
      rafId = requestAnimationFrame(draw);
    }

    video.addEventListener('ended', () => {
      cancelAnimationFrame(rafId);
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0);
      }
      onEnded();
    });

    video.addEventListener('loadeddata', () => {
      draw();
      video.play().catch(() => {});
    });

    video.src = src;
    video.load();
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  });

  export function pause() {
    if (video) video.pause();
  }
</script>

<canvas bind:this={canvas} class={className}></canvas>
