<script lang="ts">
	import { onMount } from 'svelte';
	import { go } from '$lib/nav';

	onMount(() => void go('/add', { replaceState: true }));
</script>
