<script lang="ts">
	import DeleteIcon from '$lib/static/icons/deleteIcon.svelte';
	import { Query } from 'zero-svelte';
	import { isPast } from '$lib/utils/isPast';
	import { isToday } from '$lib/utils/isToday';

	let { data, shortlist = false } = $props();
	let z = data.z;
	const groupId = data.groupId;

	// Query events (ordered by createdAt for a deterministic replica order).
	const events = z
		? new Query(z.current.query.events.where('assignedToId', groupId).orderBy('createdAt', 'asc'))
		: null;


	let numberOfItems = $derived(events.current?.length ?? 0);

	let sortedEvents = $derived(
		Array.isArray(events?.current)
			? events.current.slice().sort((a, b) => {
					const hasDate = (x: any) => typeof x?.date === 'string' && x.date.trim() !== '';
					const hasTime = (x: any) => typeof x?.time === 'string' && x.time.trim() !== '';

					const parseDateMs = (d: string) => {
						if (!d) return NaN;
						const ms = Date.parse(d);
						return Number.isFinite(ms) ? ms : NaN;
					};

					const parseDateTimeMs = (d: string, t: string) => {
						if (!d || !t) return NaN;
						const dt = new Date(`${d}T${t}`);
						return Number.isFinite(dt.getTime()) ? dt.getTime() : NaN;
					};

					const getCreatedAt = (x: any) => {
						const v = x?.createdAt;
						if (typeof v === 'number') return v;
						if (typeof v === 'string') {
							const n = Number(v);
							if (!Number.isNaN(n) && Number.isFinite(n)) return n;
							const parsed = Date.parse(v);
							if (!Number.isNaN(parsed)) return parsed;
						}
						return 0;
					};

					const aHasDate = hasDate(a);
					const bHasDate = hasDate(b);

					// Both have a date
					if (aHasDate && bHasDate) {
						const aHasTime = hasTime(a);
						const bHasTime = hasTime(b);

						// If both have date+time compare full datetime
						if (aHasTime && bHasTime) {
							const adt = parseDateTimeMs(a.date, a.time);
							const bdt = parseDateTimeMs(b.date, b.time);
							if (!Number.isNaN(adt) && !Number.isNaN(bdt) && adt !== bdt) return adt - bdt;
						}

						// Compare by date only
						const ad = parseDateMs(a.date);
						const bd = parseDateMs(b.date);
						if (!Number.isNaN(ad) && !Number.isNaN(bd) && ad !== bd) return ad - bd;

						// Same date (or invalid parses) -> tie-breaker by createdAt
						return getCreatedAt(a) - getCreatedAt(b);
					}

					// One has a date -> it comes first
					if (aHasDate) return -1;
					if (bHasDate) return 1;

					// Neither has a date -> ignore time and sort by createdAt
					return getCreatedAt(a) - getCreatedAt(b);
				})
			: undefined
	);

	function formatDate(dateString: string) {
		// convert date string to a more readable format
		if (!dateString) return '';
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};

		// Parse plain YYYY-MM-DD as local date to avoid timezone shifts that can
		// cause the displayed day to be one day earlier in some timezones.
		let date: Date;
		const isoDateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (isoDateMatch) {
			const y = Number(isoDateMatch[1]);
			const m = Number(isoDateMatch[2]) - 1;
			const d = Number(isoDateMatch[3]);
			date = new Date(y, m, d);
		} else {
			// fallback for other formats
			date = new Date(dateString);
		}

		return date.toLocaleDateString(undefined, options);
	}

	function formatTime(timeString: string, timezone?: string) {
		// convert time string to a more readable format
		if (!timeString) return '';
		const [hours, minutes] = timeString.split(':').map(Number);
		const date = new Date();
		date.setHours(hours, minutes, 0, 0);
		const options: Intl.DateTimeFormatOptions = {
			hour: '2-digit',
			minute: '2-digit'
			// timeZoneName: timezone ? 'short' : undefined
		};
		return date.toLocaleTimeString(undefined, options);
	}

	function getDateClass(dateString: string, timeString?: string): string {
		if (isToday(dateString, timeString)) return 'today';
		if (isPast(dateString, timeString)) return 'past';
		return '';
	}

	function deleteItem(id: number) {
		if (!id) {
			console.error('No ID provided for deletion.');
			return;
		}
		if (id) {
			z.current.mutate.events.delete({ id });
		}
	}
</script>

<div>
	{#if shortlist}
		{#if Array.isArray(sortedEvents)}
			<ul class="shortlist">
				{#each sortedEvents as event, i}
					{#if i < 3}
						<li class={getDateClass(event.date, event.time)}>
							<span class="event-name">{event.name}</span>
							<!-- {#if event.date}
								<span class="event-date">{formatDate(event.date)}</span>
								{#if event.time}
									<span class="event-time"> - {formatTime(event.time, event.timezone)}</span>
								{/if}
							{/if} -->
						</li>
					{/if}
				{/each}
				{#if numberOfItems > 3}
					<li>and {numberOfItems - 3} more...</li>
				{/if}
			</ul>
		{/if}
	{:else if Array.isArray(sortedEvents) && sortedEvents.length === 0}
		<p>No events found.</p>
	{:else if Array.isArray(sortedEvents)}
		<ul class="longList">
			{#each sortedEvents as event}
				<li class={getDateClass(event.date, event.time)}>
					<span class="event-name">{event.name}</span>
					{#if event.date}
						<span class="event-date">{formatDate(event.date)}</span>
						{#if event.time}
							<span class="event-time">{formatTime(event.time, event.timezone)}</span>
						{/if}
					{/if}
					<button onclick={() => deleteItem(event.id)}><DeleteIcon /></button>
				</li>
			{/each}
		</ul>
	{:else}
		<p>Loading events...</p>
	{/if}
</div>

<style>
	button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		box-shadow: none;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.longList li {
		display: grid;
		grid-template-columns: 1fr auto;
		box-shadow: var(--level-1);
		border-radius: 10px;
		padding: 10px;
		margin-bottom: 15px;
		.event-name {
			font-weight: 800;
			grid-column: 1;
			grid-row: 1;
			font-family: var(--headerFont);
			font-size: 1.1em;
		}
		.event-date {
			color: var(--color-secondary);
			grid-column: 1;
			grid-row: 2;
		}
		.event-time {
			color: var(--color-tertiary);
			grid-column: 1;
			grid-row: 3;
		}
		button {
			grid-column: 2;
			justify-self: end;
			grid-row: 1;
			&:hover {
				box-shadow: none;
			}
		}
	}
	ul.shortlist {
		list-style: circle;
		padding-left: 20px;
		margin: 0;
	}
	.shortlist {
		border-bottom: 1px solid var(--text-color);
		.event-name {
			font-weight: 800;
			font-family: var(--headerFont);
			font-size: 1.1em;
			margin-right: 10px;
		}
		.today {
			color: var(--color-primary, #007acc);
		}
		.past {
			color: var(--color-tertiary, #dc3545);
		}
	}
	.longList {
		.today {
			background-color: var(--color-primary, #007acc);
			color: white;
			font-weight: bold;
			border-radius: 5px;
			padding: 5px;
		}

		.past {
			background-color: #dc3545;
			color: white;
			font-weight: bold;
			border-radius: 5px;
			padding: 5px;
		}
	}
</style>
