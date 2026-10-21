<script lang="ts">
	let { title }: { title: string } = $props();

	let heading: HTMLElement;
	let collapsed = $state(false);

	$effect(() => {
		const io = new IntersectionObserver(([e]) => (collapsed = !e.isIntersecting), {
			rootMargin: '-44px 0px 0px 0px'
		});
		io.observe(heading);
		return () => io.disconnect();
	});
</script>

<header class="bar" class:collapsed>
	<span class="small">{title}</span>
</header>
<h1 bind:this={heading}>{title}</h1>

<style>
	.bar {
		position: sticky;
		top: 0;
		z-index: 10;
		height: calc(var(--navbar-h) + var(--safe-top));
		padding-top: var(--safe-top);
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 -16px;
		background: transparent;
		border-bottom: 1px solid transparent;
		transition: background 0.15s, border-color 0.15s;
	}
	.bar.collapsed {
		background: var(--bar-bg);
		backdrop-filter: blur(12px);
		border-color: var(--border);
	}
	.small {
		font-size: 17px;
		font-weight: 600;
		opacity: 0;
		transition: opacity 0.15s;
	}
	.collapsed .small {
		opacity: 1;
	}
	h1 {
		font-size: 32px;
		font-weight: 700;
		margin: 0 0 12px;
	}
</style>
