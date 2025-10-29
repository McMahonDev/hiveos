<script lang="ts">
	let { item }: { item: any } = $props();
</script>

<div class="bookmark-details">
	{#if item.url}
		<a href={item.url} target="_blank" rel="noopener noreferrer" class="bookmark-url">
			🔗 {item.url}
		</a>
	{/if}
	{#if item.description}
		<p class="bookmark-description">{item.description}</p>
	{/if}
	{#if item.tags}
		<div class="bookmark-tags">
			{#each item.tags.split(',').map((t: string) => t.trim()) as tag}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.bookmark-details {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 0.875rem;
	}

	.bookmark-url {
		color: #007bff;
		text-decoration: none;
		word-break: break-all;
	}

	.bookmark-url:hover {
		text-decoration: underline;
	}

	.bookmark-description {
		margin: 0;
		color: var(--color-tertiary, #666);
		line-height: 1.4;
	}

	.bookmark-tags {
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
