<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils/dateFormatters';

	let { item }: { item: any } = $props();
</script>

<div class="event-details">
	{#if item.date}
		<span class="event-date">📅 {formatDate(item.date)}</span>
	{/if}
	{#if !item.allDay && item.time}
		<span class="event-time">🕐 {formatTime(item.time, item.timezone)}</span>
	{/if}
	{#if item.allDay}
		<span class="event-all-day">All Day</span>
	{/if}
	{#if item.location}
		<span class="event-location">📍 {item.location}</span>
	{/if}
	{#if item.description}
		<p class="event-description">{item.description}</p>
	{/if}
</div>

<style>
	.event-details {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		font-size: 0.875rem;
	}

	.event-date,
	.event-time,
	.event-location,
	.event-all-day {
		padding: 4px 8px;
		background: rgba(0, 123, 255, 0.08);
		border-radius: 4px;
		color: var(--text-color, #333);
	}

	.event-description {
		width: 100%;
		margin: 4px 0 0 0;
		padding: 8px;
		background: rgba(0, 0, 0, 0.02);
		border-radius: 4px;
		font-size: 0.875rem;
		line-height: 1.4;
	}
</style>
