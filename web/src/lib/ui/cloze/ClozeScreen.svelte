<script lang="ts">
	import { flushSync } from 'svelte';
	import { formIndex, wordById } from '$lib/content';
	import { metaTags } from '$lib/content/labels';
	import { isCorrect, linkWords, maxHintLetters, parseCloze } from '$lib/domain/cloze';
	import { href } from '$lib/nav';
	import { answerCloze, nextCloze, useHint, useLetterHint, type ClozeView } from '$lib/state/cloze.svelte';
	import { app } from '$lib/state/store.svelte';
	import { keyboardInset } from '$lib/ui/keyboard.svelte';
	import ChoiceGrid from './ChoiceGrid.svelte';
	import HintsRow, { type Hint } from './HintsRow.svelte';

	let { view }: { view: ClozeView } = $props();

	const word = $derived(wordById.get(view.wordId)!);
	const sentence = $derived(word.cloze[view.sentence]);
	const gap = $derived(parseCloze(sentence.en));
	const before = $derived(linkWords(gap.before, formIndex));
	const after = $derived(linkWords(gap.after, formIndex));
	const settings = $derived(app.settings.cloze);
	const typing = $derived(settings.answerMode === 'typing');
	const showTranslation = $derived(settings.showTranslation || view.hints.translation);
	const showMeta = $derived(settings.showMeta || view.hints.meta);

	const hints: Hint[] = $derived.by(() => {
		const list: Hint[] = [];
		if (!settings.showTranslation) list.push({ label: 'Перевод', used: view.hints.translation, onUse: () => useHint('translation') });
		if (typing) {
			const max = maxHintLetters(gap.answer);
			list.push({
				label: view.prefix.length === 0 ? '1-я буква' : '2-я буква',
				used: view.prefix.length >= max,
				onUse: useLetterHint
			});
		}
		if (!settings.showMeta) list.push({ label: 'Мета', used: view.hints.meta, onUse: () => useHint('meta') });
		return list;
	});

	const kb = keyboardInset();
	let input: HTMLInputElement | undefined = $state();

	// Focus the field for every new word. iOS opens the keyboard only inside a tap,
	// so on first entry the user may have to tap the field once.
	$effect(() => {
		void view.wordId;
		if (typing && !view.closed) input?.focus();
	});

	function check() {
		const value = view.prefix + view.typed;
		if (!value.trim()) return;
		answerCloze(isCorrect(value, gap.answer) ? 'correct' : 'wrong', value);
	}

	/** «Дальше» runs inside the tap, so focusing the next field opens the keyboard on iOS. */
	function next() {
		flushSync(nextCloze);
		if (app.settings.cloze.answerMode === 'typing') input?.focus();
	}

	function gaveUp() {
		answerCloze('gaveUp', null);
	}

	const closedText = $derived(view.closed?.outcome === 'wrong' ? view.closed.picked : gap.answer);
</script>

{#snippet words(segments: ReturnType<typeof linkWords>)}
	{#each segments as seg, i (i)}
		{#if seg.wordId}
			<a class="w" href={href(`/review/cloze/word/${seg.wordId}`)}>{seg.text}</a>
		{:else}{seg.text}{/if}
	{/each}
{/snippet}

<div class="sentence">
	{@render words(before)}{#if view.closed}<span class="inl" class:ok={view.closed.outcome !== 'wrong'} class:bad={view.closed.outcome === 'wrong'}
			>{closedText}</span
		>{:else if typing}<span class="inl"
			>{#if view.prefix}<b class="locked">{view.prefix}</b>{/if}<input
				bind:this={input}
				bind:value={view.typed}
				style:width="{Math.max(6 - view.prefix.length, view.typed.length + 1)}ch"
				enterkeyhint="done"
				autocomplete="off"
				autocapitalize="none"
				autocorrect="off"
				spellcheck="false"
				aria-label="Пропущенное слово"
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						check();
					}
				}}
			/></span
		>{:else}<span class="blank"></span>{/if}{@render words(after)}
</div>

{#if showTranslation}<p class="trans">{sentence.ru}</p>{/if}
{#if showMeta}
	<div class="tags">
		{#each metaTags(word) as t (t)}<span>{t}</span>{/each}
	</div>
{/if}

{#if view.closed}
	<div class="bottom">
		{#if !typing}
			<ChoiceGrid choices={view.choices} answer={gap.answer} picked={view.closed.picked} closed onPick={() => {}} />
		{:else if view.closed.outcome === 'wrong'}
			<p class="right">Правильно: <b>{gap.answer}</b></p>
		{/if}
		<a class="cardlink" href={href(`/review/cloze/word/${word.id}`)}>Открыть карточку {word.word} ›</a>
		<button class="primary" onclick={next}>Дальше</button>
	</div>
{:else if typing}
	<div class="dock" style:bottom="{kb.px}px" class:raised={kb.px > 0}>
		<HintsRow {hints} />
		<div class="btns">
			<button class="give" onpointerdown={(e) => e.preventDefault()} onclick={gaveUp}>Сдаться</button>
			<button class="skip" onpointerdown={(e) => e.preventDefault()} onclick={next}>Дальше</button>
		</div>
	</div>
{:else}
	<div class="bottom">
		<HintsRow {hints} />
		<ChoiceGrid
			choices={view.choices}
			answer={gap.answer}
			picked={null}
			closed={false}
			onPick={(c) => answerCloze(c === gap.answer ? 'correct' : 'wrong', c)}
		/>
		<div class="btns">
			<button class="give" onclick={gaveUp}>Сдаться</button>
			<button class="skip" onclick={next}>Дальше</button>
		</div>
	</div>
{/if}

<style>
	.sentence {
		padding-top: 24px;
		font-size: 22px;
		line-height: 1.9;
	}
	.w {
		color: inherit;
		border-bottom: 1px dotted var(--text-3);
	}
	.inl {
		display: inline-block;
		min-width: 6ch;
		padding: 0 8px;
		border: 1.5px solid var(--accent);
		border-radius: 8px;
		background: var(--accent-soft);
		line-height: 1.45;
	}
	.inl input {
		border: none;
		outline: none;
		background: transparent;
		font: inherit;
		color: inherit;
		padding: 0;
		min-width: 1ch;
	}
	.locked {
		color: var(--accent);
	}
	.inl.ok {
		border-color: var(--success);
		background: var(--success-soft);
		color: var(--success);
		font-weight: 600;
	}
	.inl.bad {
		border-color: var(--danger);
		background: var(--danger-soft);
		color: var(--danger);
		font-weight: 600;
	}
	.blank {
		display: inline-block;
		min-width: 6ch;
		border-bottom: 2px solid var(--accent);
	}
	.trans {
		margin-top: 8px;
		color: var(--text-2);
		font-size: 15px;
	}
	.tags {
		display: flex;
		gap: 6px;
		margin-top: 10px;
	}
	.tags span {
		padding: 3px 9px;
		border-radius: 12px;
		background: var(--surface-2);
		color: var(--text-2);
		font-size: 13px;
	}
	.bottom {
		position: fixed;
		left: 16px;
		right: 16px;
		bottom: calc(var(--safe-bottom) + 16px);
	}
	.dock {
		position: fixed;
		left: 0;
		right: 0;
		padding: 8px 12px calc(var(--safe-bottom) + 8px);
		background: var(--bg-grouped);
		border-top: 1px solid var(--border);
	}
	.dock.raised {
		padding-bottom: 8px;
	}
	.btns {
		display: flex;
		gap: 8px;
	}
	.btns button,
	.primary {
		flex: 1;
		padding: 14px 0;
		border-radius: var(--radius);
		font-weight: 600;
	}
	.give {
		background: var(--surface);
		color: var(--danger);
		border: 1px solid var(--danger-soft);
	}
	.skip {
		background: var(--surface);
		color: var(--accent);
		border: 1px solid var(--accent-soft);
	}
	.primary {
		display: block;
		width: 100%;
		background: var(--accent);
		color: #fff;
	}
	.right {
		margin-bottom: 8px;
		text-align: center;
		color: var(--text-2);
	}
	.right b {
		color: var(--success);
		font-size: 18px;
	}
	.cardlink {
		display: block;
		margin-bottom: 10px;
		text-align: center;
		font-size: 15px;
	}
</style>
