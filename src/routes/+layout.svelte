<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	:global(*) {
		-webkit-tap-highlight-color: transparent;
		scrollbar-color: #4a4a6a #1a1a2e;
		scrollbar-width: thin;
	}

	:global(*::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}

	:global(*::-webkit-scrollbar-track) {
		background: #1a1a2e;
	}

	:global(*::-webkit-scrollbar-thumb) {
		background: #4a4a6a;
		border-radius: 3px;
	}
</style>
