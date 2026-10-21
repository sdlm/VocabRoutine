<script lang="ts">
	let { label, note, checked = $bindable() }: { label: string; note?: string; checked: boolean } = $props();
</script>

<label class="row">
	<span class="text">
		{label}
		{#if note}<small>{note}</small>{/if}
	</span>
	<input type="checkbox" role="switch" bind:checked />
</label>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		cursor: pointer;
	}
	.text {
		flex: 1;
	}
	small {
		display: block;
		margin-top: 2px;
		font-size: 13px;
		color: var(--text-3);
		line-height: 1.3;
	}
	input {
		appearance: none;
		flex-shrink: 0;
		position: relative;
		width: 51px;
		height: 31px;
		border-radius: 16px;
		background: var(--surface-2);
		transition: background 0.2s;
		cursor: pointer;
	}
	input::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 27px;
		height: 27px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s;
	}
	input:checked {
		background: #34c759;
	}
	input:checked::after {
		transform: translateX(20px);
	}
</style>
