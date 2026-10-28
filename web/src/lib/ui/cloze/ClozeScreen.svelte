<script lang="ts">
	import { flushSync, untrack } from 'svelte';
	import { formIndex, wordById } from '$lib/content';
	import { metaTags } from '$lib/content/labels';
	import { isCorrect, linkWords, maxHintLetters, parseCloze, typingState } from '$lib/domain/cloze';
	import { href } from '$lib/nav';
	import { answerCloze, nextCloze, noteRuledOut, useHint, useLetterHint, type ClozeView } from '$lib/state/cloze.svelte';
	import { app } from '$lib/state/store.svelte';
	import { keyboardInset } from '$lib/ui/keyboard.svelte';
	import { tapGuard } from '$lib/ui/tap-guard.svelte';
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

	/** Runs a hint inside the tap and keeps the keyboard up. */
	const use = (fn: () => void) => () => {
		fn();
		input?.focus();
	};

	const hints: Hint[] = $derived.by(() => {
		const list: Hint[] = [];
		if (!settings.showTranslation) {
			list.push({ id: 'translation', label: 'Перевод', used: view.hints.translation, onUse: use(() => useHint('translation')) });
		}
		if (typing) {
			const max = maxHintLetters(gap.answer);
			list.push({
				id: 'letter',
				label: view.prefix.length === 0 || max < 2 ? '1-я буква' : '2-я буква',
				used: view.prefix.length >= max,
				onUse: use(useLetterHint)
			});
		}
		if (!settings.showMeta) list.push({ id: 'meta', label: 'Мета', used: view.hints.meta, onUse: use(() => useHint('meta')) });
		return list;
	});

	const kb = keyboardInset();
	/** A one-row textarea, not an input: Android Chrome shows its autofill bar (key/card/pin) over any input. */
	let input: HTMLTextAreaElement | undefined = $state();

	// Focus the field for every new word. iOS opens the keyboard only inside a tap,
	// so on first entry the user may have to tap the field once.
	$effect(() => {
		void view.wordId;
		if (typing && !view.closed) input?.focus();
	});

	// Each change of the input may point at another alsoFits word.
	$effect(() => {
		void (view.prefix + view.typed);
		untrack(noteRuledOut);
	});

	const tooSoon = tapGuard(() => [view.wordId, view.closed]);

	function check() {
		const value = view.prefix + view.typed;
		if (!value.trim()) return;
		answerCloze(isCorrect(value, gap.answer) ? 'correct' : 'wrong', value);
	}

	/** «Дальше» runs inside the tap, so focusing the next field opens the keyboard on iOS. */
	function next() {
		if (tooSoon()) return;
		flushSync(nextCloze);
		if (app.settings.cloze.answerMode === 'typing') input?.focus();
	}

	function gaveUp() {
		if (tooSoon()) return;
		answerCloze('gaveUp', null);
	}

	const live = $derived(typingState(view.prefix + view.typed, gap.answer));
	/** A correct answer turns «Сдаться» into «Подтвердить». */
	const ready = $derived(isCorrect(view.prefix + view.typed, gap.answer));

	// Only typing shows the typed word on red; «4 слова» always shows the answer on green.
	const typedWrong = $derived(typing && view.closed?.outcome === 'wrong');
	const closedText = $derived(typedWrong ? view.closed!.picked : gap.answer);
</script>

{#snippet words(segments: ReturnType<typeof linkWords>)}
	{#each segments as seg, i (i)}
		{#if seg.wordId}
			<a class="w" href={href(`/review/cloze/word/${seg.wordId}`)}>{seg.text}</a>
		{:else}{seg.text}{/if}
	{/each}
{/snippet}

<div class="sentence">
	{@render words(before)}{#if view.closed}<span class="inl" class:ok={!typedWrong} class:bad={typedWrong}
			>{closedText}</span
		>{:else if typing}<span class="inl" data-state={live}
			>{#if view.prefix}<b class="locked">{view.prefix}</b>{/if}<textarea
				bind:this={input}
				bind:value={view.typed}
				style:width="{Math.max(6 - view.prefix.length, view.typed.length + 2)}ch"
				rows="1"
				wrap="off"
				enterkeyhint="done"
				autocomplete="off"
				autocapitalize="none"
				{...{ autocorrect: 'off' } /* Safari-only; missing from Svelte's textarea types */}
				spellcheck="false"
				aria-label="Пропущенное слово"
				onkeydown={(e) => {
					if (e.isComposing) return;
					if (e.key === 'Enter') {
						e.preventDefault();
						check();
					}
				}}
				onbeforeinput={(e) => {
					// Android keyboards may send Enter as a line break instead of a key event
					if (e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph') {
						e.preventDefault();
						check();
					}
				}}
			></textarea></span
		>{:else}<span class="blank"></span>{/if}{@render words(after)}
</div>

{#if showTranslation}<p class="trans">{sentence.ru}</p>{/if}
{#if showMeta}
	<div class="tags">
		{#each metaTags(word) as t (t)}<span>{t}</span>{/each}
	</div>
{/if}
{#if typing && view.ruledOut.length}
	<p class="ruled">Точно не: {#each view.ruledOut as w, i (w)}{#if i}{', '}{/if}<b>{w}</b>{/each}</p>
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
	<!-- pointerdown/mousedown are cancelled so taps in the dock keep the input focused and the keyboard open -->
	<div
		class="dock"
		style:bottom="{kb.px}px"
		class:raised={kb.px > 0}
		role="toolbar"
		tabindex="-1"
		onpointerdown={(e) => e.preventDefault()}
		onmousedown={(e) => e.preventDefault()}
	>
		<HintsRow {hints}>
			{#snippet end()}
				<button
					class="pill {ready ? 'confirm' : 'give'}"
					onpointerdown={(e) => e.preventDefault()}
					onmousedown={(e) => e.preventDefault()}
					onclick={ready ? check : gaveUp}>{ready ? 'Подтвердить' : 'Сдаться'}</button
				>
			{/snippet}
		</HintsRow>
	</div>
{:else}
	<div class="bottom">
		<HintsRow {hints} />
		<ChoiceGrid
			choices={view.choices}
			answer={gap.answer}
			picked={null}
			closed={false}
			onPick={(c) => {
				if (tooSoon()) return;
				answerCloze(c === gap.answer ? 'correct' : 'wrong', c);
			}}
		/>
		<div class="btns">
			<button class="give" onclick={gaveUp}>Сдаться</button>
		</div>
	</div>
{/if}

<div class="spacer" aria-hidden="true"></div>

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
	.inl textarea {
		display: inline-block;
		vertical-align: bottom;
		border: none;
		outline: none;
		background: transparent;
		font: inherit;
		color: inherit;
		padding: 0;
		min-width: 1ch;
		height: 1lh;
		resize: none;
		overflow: hidden;
		white-space: pre;
	}
	.inl[data-state='empty'] {
		border-color: var(--text-3);
		background: var(--surface-2);
	}
	.inl[data-state='ok'] {
		border-color: var(--success);
		background: var(--success-soft);
	}
	.inl[data-state='bad'] {
		border-color: var(--danger);
		background: var(--danger-soft);
	}
	.locked {
		color: var(--success);
	}
	.inl[data-state='bad'] .locked {
		color: var(--danger);
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
	.ruled {
		margin-top: 8px;
		color: var(--text-2);
		font-size: 15px;
	}
	.ruled b {
		font-weight: 600;
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
	.spacer {
		height: 280px;
	}
	.btns {
		display: flex;
		gap: 8px;
	}
	.btns button,
	.primary {
		touch-action: manipulation;
		flex: 1;
		padding: 14px 0;
		border-radius: var(--radius);
		font-weight: 600;
	}
	.pill {
		touch-action: manipulation;
		padding: 6px 14px;
		border-radius: 16px;
		font-size: 14px;
		font-weight: 600;
	}
	.give {
		background: var(--surface);
		color: var(--danger);
		border: 1px solid var(--danger-soft);
	}
	.confirm {
		background: var(--success);
		color: #fff;
		border: 1px solid var(--success);
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
