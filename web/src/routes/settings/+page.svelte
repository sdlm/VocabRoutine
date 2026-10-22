<script lang="ts">
	import Coffee from '@lucide/svelte/icons/coffee';
	import Flame from '@lucide/svelte/icons/flame';
	import LayoutList from '@lucide/svelte/icons/layout-list';
	import SunMoon from '@lucide/svelte/icons/sun-moon';
	import Target from '@lucide/svelte/icons/target';
	import TextCursorInput from '@lucide/svelte/icons/text-cursor-input';
	import Timer from '@lucide/svelte/icons/timer';
	import { streakInfo } from '$lib/domain/streak';
	import { dayKey } from '$lib/domain/time';
	import { DAY_FORMS, plural } from '$lib/format';
	import { href } from '$lib/nav';
	import type { Theme } from '$lib/state/schema';
	import { app, resetDemo } from '$lib/state/store.svelte';
	import Group from '$lib/ui/controls/Group.svelte';
	import ListRow from '$lib/ui/controls/ListRow.svelte';
	import Segmented from '$lib/ui/controls/Segmented.svelte';
	import Stepper from '$lib/ui/controls/Stepper.svelte';
	import LargeTitle from '$lib/ui/shell/LargeTitle.svelte';

	const streak = $derived(streakInfo(app.activity, app.settings.dailyGoal, dayKey(Date.now())).current);

	const themes: { value: Theme; label: string }[] = [
		{ value: 'light', label: 'Светлая' },
		{ value: 'dark', label: 'Тёмная' },
		{ value: 'auto', label: 'Авто' }
	];

	function reset() {
		if (confirm('Стереть прогресс и засеять демо-данные заново?')) resetDemo();
	}
</script>

<main class="page grouped">
	<LargeTitle title="Настройки" />
	<Group>
		<ListRow icon={Flame} tone="warning" label="Статистика" value="{streak} {plural(streak, DAY_FORMS)}" href={href('/settings/stats')} />
	</Group>
	<Group label="Занятия">
		<ListRow icon={Target} tone="danger" label="Цель на день" note="Слов в день для стрика, оба режима">
			<Stepper bind:value={app.settings.dailyGoal} min={1} max={100} label="Цель на день" />
		</ListRow>
		<ListRow icon={Timer} tone="accent" label="Очередь" value="SRS" href={href('/settings/queue')} />
	</Group>
	<Group label="Режимы">
		<ListRow icon={LayoutList} tone="success" label="Шаблон карточки" href={href('/settings/template')} />
		<ListRow
			icon={TextCursorInput}
			tone="accent"
			label="Cloze"
			value={app.settings.cloze.answerMode === 'typing' ? 'Набор' : '4 слова'}
			href={href('/settings/cloze')}
		/>
	</Group>
	<Group label="Приложение">
		<ListRow icon={SunMoon} label="Тема">
			<Segmented compact label="Тема" options={themes} bind:value={app.settings.theme} />
		</ListRow>
		<ListRow icon={Coffee} tone="warning" label="Поддержать проект" href="https://buymeacoffee.com/vocabroutine" external />
	</Group>
	<Group label="Прототип">
		<button type="button" class="danger" onclick={reset}>Сбросить данные</button>
	</Group>
</main>

<style>
	.danger {
		display: block;
		width: 100%;
		min-height: 48px;
		padding: 12px 16px;
		text-align: left;
		color: var(--danger);
	}
</style>
