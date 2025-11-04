<script lang="ts">
	let { item }: { item: any } = $props();
</script>

<div class="contact-details">
	{#if item.phone}
		<span class="contact-info">📱 {item.phone}</span>
	{/if}
	{#if item.email}
		<span class="contact-info">✉️ {item.email}</span>
	{/if}
	{#if item.address}
		<span class="contact-info">🏠 {item.address}</span>
	{/if}
	{#if item.company}
		<span class="contact-info">🏢 {item.company}</span>
	{/if}
	{#if item.notes}
		<p class="contact-notes">{item.notes}</p>
	{/if}
</div>

<style>
	.contact-details {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 0.875rem;
	}

	.contact-info {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.contact-notes {
		margin: 6px 0 0 0;
		padding: 8px;
		background: rgba(0, 0, 0, 0.02);
		border-radius: 4px;
		font-size: 0.875rem;
		line-height: 1.4;
		font-style: italic;
	}
</style>
