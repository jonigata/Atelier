<script lang="ts">
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(:root) {
		/* Backgrounds */
		--bg-deep: #0a0a14;
		--bg-dark: #1a1a2e;
		--bg-mid: #2a2a4e;

		/* Text */
		--text-heading: #f4e4bc;
		--text-body: #e0e0f0;
		--text-sub: #a0a0b0;
		--text-dim: #808090;
		--text-muted: #6a6a8a;

		/* Accent */
		--accent-gold: #c9a959;
		--accent-gold-dark: #8b6914;
		--accent-green: #81c784;
		--accent-green-dark: #4caf50;
		--accent-red: #ff6b6b;
		--accent-orange: #ff9800;
		--accent-blue: #64b5f6;
		--accent-yellow: #ffd700;

		/* Border */
		--border-default: #4a4a6a;
		--border-hover: #6a6a8a;

		/* Surfaces */
		--surface-subtle: rgba(255, 255, 255, 0.05);
		--surface-hover: rgba(255, 255, 255, 0.1);
		--surface-dark: rgba(0, 0, 0, 0.3);

		/* Radius */
		--radius-sm: 4px;
		--radius-md: 6px;
		--radius-lg: 8px;

		/* z-index layers (see documents/technical/z-index-layers.md) */
		--z-panel: 100;
		--z-indicator: 500;
		--z-toast: 800;
		--z-backdrop: 900;
		--z-modal: 1000;
		--z-cutscene: 1100;
		--z-debug: 9000;
	}

	:global(*) {
		-webkit-tap-highlight-color: transparent;
		scrollbar-color: var(--border-default) var(--bg-dark);
		scrollbar-width: thin;
	}

	:global(*::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}

	:global(*::-webkit-scrollbar-track) {
		background: var(--bg-dark);
	}

	:global(*::-webkit-scrollbar-thumb) {
		background: var(--border-default);
		border-radius: 3px;
	}

	:global(button) {
		font-size: inherit;
	}

	/* --- Panel headings --- */
	:global(.panel h2) {
		font-size: 1.5rem;
		color: var(--text-heading);
		margin-bottom: 1rem;
	}
	:global(.panel h3) {
		font-size: 1rem;
		color: var(--accent-gold);
		margin-bottom: 0.75rem;
	}

	/* --- Action button --- */
	:global(.btn-action) {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, var(--accent-gold-dark) 0%, var(--accent-gold) 100%);
		border: none;
		border-radius: var(--radius-md);
		color: var(--bg-dark);
		font-weight: bold;
		cursor: pointer;
	}
	:global(.btn-action:hover:not(:disabled)) {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(201, 169, 89, 0.4);
	}
	:global(.btn-action:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* --- Tab button --- */
	:global(.tab-btn) {
		flex: 1;
		padding: 0.5rem;
		background: var(--surface-subtle);
		border: 2px solid var(--border-default);
		border-radius: var(--radius-md);
		color: var(--text-sub);
		cursor: pointer;
	}
	:global(.tab-btn.active) {
		border-color: var(--accent-gold);
		color: var(--text-heading);
		background: rgba(201, 169, 89, 0.2);
	}

	/* --- Item card --- */
	:global(.item-card) {
		padding: 0.75rem;
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		transition: all 0.2s;
	}
	:global(.item-card:hover) {
		background: var(--surface-hover);
		border-color: var(--border-hover);
	}

	/* --- Quality colors --- */
	:global(.quality-high) { color: var(--accent-green); }
	:global(.quality-low) { color: var(--accent-red); }

	/* --- Empty state --- */
	:global(.empty-state) {
		color: var(--text-dim);
		text-align: center;
		padding: 2rem;
	}

	/* --- Stamina fill bar --- */
	:global(.stamina-fill) { transition: width 0.3s ease; border-radius: var(--radius-sm); height: 100%; }
	:global(.stamina-fill.high) { background: linear-gradient(90deg, #4caf50, #81c784); }
	:global(.stamina-fill.medium) { background: linear-gradient(90deg, #ff9800, #ffc107); }
	:global(.stamina-fill.low) { background: linear-gradient(90deg, #ff5722, #ff9800); }
	:global(.stamina-fill.critical) { background: linear-gradient(90deg, #f44336, #ff5722); }
</style>
