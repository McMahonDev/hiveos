<script lang="ts">
	let { item }: { item: any } = $props();
</script>

<div class="message-details">
	{#if item.messageText}
		<p class="message-text">{item.messageText}</p>
	{/if}
	{#if item.priority}
		<span class="message-priority priority-{item.priority}">{item.priority}</span>
	{/if}
	{#if item.tags}
		<div class="message-tags">
			{#each item.tags.split(',').map((t: string) => t.trim()) as tag}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.message-details {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 0.875rem;
	}

	.message-text {
		margin: 0;
		padding: 10px;
		background: rgba(0, 0, 0, 0.02);
		border-radius: 4px;
		line-height: 1.5;
	}

	.message-priority {
		display: inline-block;
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.message-priority.priority-low {
		background: #e3f2fd;
		color: #1976d2;
	}

	.message-priority.priority-medium {
		background: #fff3e0;
		color: #f57c00;
	}

	.message-priority.priority-high {
		background: #fce4ec;
		color: #c2185b;
	}

	.message-priority.priority-urgent {
		background: #ffebee;
		color: #d32f2f;
	}

	.message-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.tag {
		display: inline-block;
		padding: 3px 8px;
		background: rgba(76, 175, 80, 0.12);
		color: #2e7d32;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}
</style>
