<script lang="ts">
	let { item }: { item: any } = $props();
</script>

<div class="recipe-details">
	{#if item.servings}
		<span class="recipe-servings">🍽️ Serves {item.servings}</span>
	{/if}
	{#if item.prepTime}
		<span class="recipe-time">⏱️ Prep: {item.prepTime}</span>
	{/if}
	{#if item.cookTime}
		<span class="recipe-time">🔥 Cook: {item.cookTime}</span>
	{/if}
	{#if item.ingredients}
		<details class="recipe-section">
			<summary>Ingredients</summary>
			<pre class="recipe-text">{item.ingredients}</pre>
		</details>
	{/if}
	{#if item.instructions}
		<details class="recipe-section">
			<summary>Instructions</summary>
			<pre class="recipe-text">{item.instructions}</pre>
		</details>
	{/if}
</div>

<style>
	.recipe-details {
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 0.875rem;
	}

	.recipe-servings,
	.recipe-time {
		padding: 4px 8px;
		background: rgba(255, 152, 0, 0.08);
		border-radius: 4px;
		display: inline-block;
		margin-right: 8px;
	}

	.recipe-section {
		margin-top: 8px;
	}

	.recipe-section summary {
		cursor: pointer;
		font-weight: 600;
		padding: 6px 0;
		user-select: none;
	}

	.recipe-section summary:hover {
		color: #007bff;
	}

	.recipe-text {
		margin: 8px 0 0 0;
		padding: 12px;
		background: rgba(0, 0, 0, 0.02);
		border-radius: 4px;
		white-space: pre-wrap;
		font-family: inherit;
		line-height: 1.6;
	}
</style>
