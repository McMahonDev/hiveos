<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<section>
	<h1>Login</h1>
	<form use:enhance method="POST" action="?/login">
		<input type="email" name="email" placeholder="Email" required />
		<input type="password" name="password" placeholder="Password" required />
		<button type="submit">Login</button>
	</form>
</section>
