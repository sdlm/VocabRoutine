<script lang="ts">
	let { what }: { what: string } = $props();
</script>

<div class="stub">{what}<br /><small>экран будет собран в следующих планах</small></div>

<style>
	.stub {
		margin-top: 16px;
		padding: 48px 16px;
		border: 1.5px dashed var(--border);
		border-radius: 14px;
		color: var(--text-3);
		text-align: center;
	}
</style>
