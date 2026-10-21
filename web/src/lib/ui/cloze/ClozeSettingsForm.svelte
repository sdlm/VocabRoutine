<script lang="ts">
	import Group from '$lib/ui/controls/Group.svelte';
	import Segmented from '$lib/ui/controls/Segmented.svelte';
	import Toggle from '$lib/ui/controls/Toggle.svelte';
	import { app } from '$lib/state/store.svelte';

	const modes = [
		{ value: 'typing' as const, label: '⌨ Набор' },
		{ value: 'choice' as const, label: '4 слова' }
	];
</script>

<Group label="Способ ответа">
	<Segmented label="Способ ответа" options={modes} bind:value={app.settings.cloze.answerMode} />
</Group>
<Group label="Всегда показывать">
	<Toggle label="Перевод предложения" note="Если выключено, открывается подсказкой" bind:checked={app.settings.cloze.showTranslation} />
	<Toggle
		label="Мета слова"
		note="Часть речи, уровень, регистр. Если выключено, открывается подсказкой"
		bind:checked={app.settings.cloze.showMeta}
	/>
</Group>
<Group label="Переход">
	<Toggle
		label="Авто-переход к следующему слову"
		note="При верном ответе сразу открывается следующее слово"
		bind:checked={app.settings.cloze.autoAdvance}
	/>
</Group>
