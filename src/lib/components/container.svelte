<script>
	let { children } = $props();
</script>

<div>
	{@render children()}
</div>

<style>
	div {
		max-width: var(--container-width);
		margin: 0 auto;
	}
</style>
