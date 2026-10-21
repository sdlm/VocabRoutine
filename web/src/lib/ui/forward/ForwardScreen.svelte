<script lang="ts">
	import { wordById } from '$lib/content';
	import type { ForwardSession } from '$lib/domain/forward-session';
	import { gradeForwardWord, passForwardWord, revealForwardBlock } from '$lib/state/forward.svelte';
	import { tapGuard } from '$lib/ui/tap-guard.svelte';
	import ForwardCard from './ForwardCard.svelte';
	import IntroCard from './IntroCard.svelte';

	let { session }: { session: ForwardSession } = $props();

	const step = $derived(session.queue[0]);
	const word = $derived(wordById.get(step.wordId)!);

	// «Помню» / «Не помню» sit where «Дальше» was, so a double tap must not grade the next word.
	// The guard keys on the screen count, not the session object: opening a block is not a new screen.
	const finished = $derived(session.total - session.queue.length);
	const tooSoon = tapGuard(() => finished);

	function act(fn: () => void) {
		if (tooSoon()) return;
		fn();
		window.scrollTo(0, 0);
	}
</script>

{#if step.kind === 'review'}
	<ForwardCard {word} revealed={session.revealed} onReveal={revealForwardBlock} />
	<div class="bottom">
		<button class="no" onclick={() => act(() => gradeForwardWord('forgot'))}>Не помню</button>
		<button class="yes" onclick={() => act(() => gradeForwardWord('remember'))}>Помню</button>
	</div>
{:else}
	<IntroCard {word} kind={step.kind} />
	<div class="bottom">
		<button class="next" onclick={() => act(passForwardWord)}>Дальше</button>
	</div>
{/if}

<div class="spacer" aria-hidden="true"></div>

<style>
	.bottom {
		position: fixed;
		left: 16px;
		right: 16px;
		bottom: calc(var(--safe-bottom) + 16px);
		display: flex;
		gap: 8px;
	}
	.bottom button {
		flex: 1;
		padding: 18px 0;
		border-radius: 14px;
		font-weight: 600;
		touch-action: manipulation;
	}
	.no {
		background: var(--danger-soft);
		color: var(--danger);
	}
	.yes {
		background: var(--success-soft);
		color: var(--success);
	}
	.next {
		background: var(--accent);
		color: #fff;
	}
	.spacer {
		height: 96px;
	}
</style>
