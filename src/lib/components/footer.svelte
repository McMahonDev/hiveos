<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="site-footer">
	<div class="footer-content">
		<div class="footer-section">
			<h3>HiveOS</h3>
			<p>Organize your life together</p>
		</div>
		<div class="footer-section">
			<h4>Product</h4>
			<ul>
				<li><a href="/account/register">Get Started</a></li>
				<li><a href="/account/login">Sign In</a></li>
			</ul>
		</div>
		<div class="footer-section">
			<h4>Company</h4>
			<ul>
				<li><a href="/#">About</a></li>
				<li><a href="/#">Contact</a></li>
			</ul>
		</div>
		<div class="footer-section">
			<h4>Legal</h4>
			<ul>
				<li><a href="/#">Privacy Policy</a></li>
				<li><a href="/#">Terms of Service</a></li>
			</ul>
		</div>
	</div>
	<div class="footer-bottom">
		<p>&copy; {currentYear} HiveOS. All rights reserved.</p>
	</div>
</footer>

<style>
	.site-footer {
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
		color: white;
		padding: 60px 20px 20px;
		margin-top: 0;

		@media screen and (max-width: 640px) {
			padding: 40px 20px 20px;
		}
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 40px;
		padding-bottom: 40px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);

		@media screen and (max-width: 768px) {
			grid-template-columns: 1fr 1fr;
			gap: 30px;
		}

		@media screen and (max-width: 640px) {
			grid-template-columns: 1fr;
			gap: 30px;
			text-align: center;
		}
	}

	.footer-section {
		h3 {
			font-size: 1.5rem;
			font-weight: 700;
			margin: 0 0 10px 0;
			color: var(--primary);
		}

		h4 {
			font-size: 1rem;
			font-weight: 600;
			margin: 0 0 15px 0;
			color: rgba(255, 255, 255, 0.9);
		}

		p {
			color: rgba(255, 255, 255, 0.7);
			margin: 0;
			font-size: 0.95rem;
		}

		ul {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			gap: 10px;
		}

		a {
			color: rgba(255, 255, 255, 0.7);
			text-decoration: none;
			font-size: 0.95rem;
			transition: color 0.2s ease;

			&:hover {
				color: var(--primary);
			}
		}
	}

	.footer-bottom {
		max-width: 1200px;
		margin: 0 auto;
		padding-top: 20px;
		text-align: center;

		p {
			margin: 0;
			color: rgba(255, 255, 255, 0.5);
			font-size: 0.875rem;
		}
	}
</style>
