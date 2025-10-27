<script lang="ts">
	import { user } from '$lib/state/user.svelte';
	import { invalidateAll } from '$app/navigation';

	// Form state
	let timezone = $state('America/New_York');
	let notifyMorningBriefing = $state(true);
	let notifyEveningWrapup = $state(false);
	let notifyEventReminders = $state(true);
	let notifyShoppingReminders = $state(false);
	let notifyTaskFollowups = $state(false);
	let notifyGroupActivity = $state(true);
	let notifyWeeklySummary = $state(false);
	let notifySubscriptionUpdates = $state(true);
	let morningBriefingTime = $state('08:00');
	let eveningWrapupTime = $state('18:00');

	let saving = $state(false);
	let saveMessage = $state('');
	let hasPremiumAccess = $state(false);
	let loaded = $state(false);

	// Load user preferences on mount using $effect
	$effect(() => {
		async function loadPreferences() {
			try {
				// Get user preferences from API
				const response = await fetch('/api/user/preferences');
				if (response.ok) {
					const data = await response.json();
					timezone = data.timezone || 'America/New_York';
					notifyMorningBriefing = data.notify_morning_briefing ?? true;
					notifyEveningWrapup = data.notify_evening_wrapup ?? false;
					notifyEventReminders = data.notify_event_reminders ?? true;
					notifyShoppingReminders = data.notify_shopping_reminders ?? false;
					notifyTaskFollowups = data.notify_task_followups ?? false;
					notifyGroupActivity = data.notify_group_activity ?? true;
					notifyWeeklySummary = data.notify_weekly_summary ?? false;
					notifySubscriptionUpdates = data.notify_subscription_updates ?? true;
					morningBriefingTime = data.morning_briefing_time || '08:00';
					eveningWrapupTime = data.evening_wrapup_time || '18:00';
				}

				// Check premium access
				const premiumResponse = await fetch('/api/check-premium');
				if (premiumResponse.ok) {
					const premiumData = await premiumResponse.json();
					hasPremiumAccess = premiumData.hasPremium;
				}

				loaded = true;
			} catch (error) {
				console.error('Error loading preferences:', error);
				loaded = true;
			}
		}

		loadPreferences();
	});

	async function savePreferences(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		saveMessage = '';

		try {
			const response = await fetch('/api/user/preferences', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					timezone,
					notify_morning_briefing: notifyMorningBriefing,
					notify_evening_wrapup: notifyEveningWrapup,
					notify_event_reminders: notifyEventReminders,
					notify_shopping_reminders: notifyShoppingReminders,
					notify_task_followups: notifyTaskFollowups,
					notify_group_activity: notifyGroupActivity,
					notify_weekly_summary: notifyWeeklySummary,
					notify_subscription_updates: notifySubscriptionUpdates,
					morning_briefing_time: morningBriefingTime,
					evening_wrapup_time: eveningWrapupTime
				})
			});

			if (response.ok) {
				saveMessage = 'Preferences saved successfully!';
				await invalidateAll();
				setTimeout(() => {
					saveMessage = '';
				}, 3000);
			} else {
				const error = await response.json();
				saveMessage = error.message || 'Error saving preferences. Please try again.';
			}
		} catch (error) {
			console.error('Error saving preferences:', error);
			saveMessage = 'Error saving preferences. Please try again.';
		} finally {
			saving = false;
		}
	}

	// Common timezone options
	const timezones = [
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'America/Anchorage',
		'Pacific/Honolulu',
		'Europe/London',
		'Europe/Paris',
		'Europe/Berlin',
		'Asia/Tokyo',
		'Asia/Shanghai',
		'Asia/Dubai',
		'Australia/Sydney',
		'UTC'
	];
</script>

<svelte:head>
	<title>Notification Settings - HiveOS</title>
</svelte:head>

<div class="container">
	<div class="header">
		<a href="/account" class="back-link">← Back to Account</a>
		<h1>Notification Settings</h1>
		<p class="subtitle">
			{#if hasPremiumAccess}
				Customize when and how you receive email notifications
			{:else}
				<span class="premium-badge"> 🔒 Premium Feature - Upgrade to enable notifications </span>
			{/if}
		</p>
	</div>

	{#if !hasPremiumAccess}
		<div class="premium-notice">
			<h3>📧 Email Notifications are a Premium Feature</h3>
			<p>
				Get daily briefings, event reminders, and group activity updates with a paid subscription.
			</p>
			<a href="/account/subscription" class="upgrade-button">Upgrade Now</a>
		</div>
	{/if}

	<form onsubmit={savePreferences} class:disabled={!hasPremiumAccess}>
		<!-- Timezone -->
		<section class="settings-section">
			<h2>⏰ Timezone</h2>
			<p class="section-description">
				Set your timezone so we send notifications at the right time for you.
			</p>

			<div class="form-group">
				<label for="timezone">Your Timezone</label>
				<select id="timezone" bind:value={timezone} disabled={!hasPremiumAccess}>
					{#each timezones as tz}
						<option value={tz}>{tz}</option>
					{/each}
				</select>
			</div>
		</section>

		<!-- Daily Digests -->
		<section class="settings-section">
			<h2>📬 Daily Digests</h2>
			<p class="section-description">Receive daily summaries of your tasks, events, and lists.</p>

			<div class="checkbox-group">
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={notifyMorningBriefing}
						disabled={!hasPremiumAccess}
					/>
					<div class="checkbox-content">
						<div class="checkbox-title">☀️ Morning Briefing</div>
						<div class="checkbox-description">
							Start your day with today's events, pending tasks, and shopping lists
						</div>
					</div>
				</label>

				{#if notifyMorningBriefing}
					<div class="time-picker">
						<label for="morning-time">Delivery time:</label>
						<input
							id="morning-time"
							type="time"
							bind:value={morningBriefingTime}
							disabled={!hasPremiumAccess}
						/>
					</div>
				{/if}
			</div>

			<div class="checkbox-group">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={notifyEveningWrapup} disabled={!hasPremiumAccess} />
					<div class="checkbox-content">
						<div class="checkbox-title">🌙 Evening Wrap-up</div>
						<div class="checkbox-description">
							Review your accomplishments and preview tomorrow's schedule
						</div>
					</div>
				</label>

				{#if notifyEveningWrapup}
					<div class="time-picker">
						<label for="evening-time">Delivery time:</label>
						<input
							id="evening-time"
							type="time"
							bind:value={eveningWrapupTime}
							disabled={!hasPremiumAccess}
						/>
					</div>
				{/if}
			</div>
		</section>

		<!-- Event & Task Reminders -->
		<section class="settings-section">
			<h2>🔔 Reminders</h2>
			<p class="section-description">Get notified about upcoming events and pending tasks.</p>

			<div class="checkbox-group">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={notifyEventReminders} disabled={!hasPremiumAccess} />
					<div class="checkbox-content">
						<div class="checkbox-title">📅 Event Reminders</div>
						<div class="checkbox-description">
							Receive notifications 1 hour before your events start
						</div>
					</div>
				</label>
			</div>

			<div class="checkbox-group">
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={notifyShoppingReminders}
						disabled={!hasPremiumAccess}
					/>
					<div class="checkbox-content">
						<div class="checkbox-title">🛒 Shopping List Reminders</div>
						<div class="checkbox-description">
							Get reminded about shopping lists that haven't been completed
						</div>
					</div>
				</label>
			</div>

			<div class="checkbox-group">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={notifyTaskFollowups} disabled={!hasPremiumAccess} />
					<div class="checkbox-content">
						<div class="checkbox-title">✅ Task Follow-ups</div>
						<div class="checkbox-description">Weekly reminders for overdue tasks</div>
					</div>
				</label>
			</div>
		</section>

		<!-- Group Notifications -->
		<section class="settings-section">
			<h2>👥 Group Activity</h2>
			<p class="section-description">Stay updated when group members add or modify shared items.</p>

			<div class="checkbox-group">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={notifyGroupActivity} disabled={!hasPremiumAccess} />
					<div class="checkbox-content">
						<div class="checkbox-title">📋 Group Activity Notifications</div>
						<div class="checkbox-description">
							Get notified when group members add multiple items (5+) at once
						</div>
					</div>
				</label>
			</div>
		</section>

		<!-- Weekly Summary -->
		<section class="settings-section">
			<h2>📊 Reports</h2>
			<p class="section-description">Receive periodic summaries of your productivity.</p>

			<div class="checkbox-group">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={notifyWeeklySummary} disabled={!hasPremiumAccess} />
					<div class="checkbox-content">
						<div class="checkbox-title">📈 Weekly Summary</div>
						<div class="checkbox-description">
							Get a weekly report of your completed tasks and attended events
						</div>
					</div>
				</label>
			</div>
		</section>

		<!-- Subscription Updates -->
		<section class="settings-section">
			<h2>💳 Account & Billing</h2>
			<p class="section-description">Stay informed about your subscription status.</p>

			<div class="checkbox-group">
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={notifySubscriptionUpdates}
						disabled={!hasPremiumAccess}
					/>
					<div class="checkbox-content">
						<div class="checkbox-title">📧 Subscription Notifications</div>
						<div class="checkbox-description">
							Important updates about billing, renewals, and payment issues
						</div>
					</div>
				</label>
			</div>
		</section>

		<!-- Save Button -->
		<div class="actions">
			<button type="submit" disabled={saving || !hasPremiumAccess} class="save-button">
				{saving ? 'Saving...' : 'Save Preferences'}
			</button>

			{#if saveMessage}
				<div class="save-message" class:error={saveMessage.includes('Error')}>
					{saveMessage}
				</div>
			{/if}
		</div>
	</form>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-block;
		color: #666;
		text-decoration: none;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.back-link:hover {
		color: #000;
	}

	h1 {
		font-size: 2rem;
		font-weight: 800;
		margin: 0 0 0.5rem 0;
	}

	.subtitle {
		color: #666;
		margin: 0;
	}

	.premium-badge {
		display: inline-block;
		background: linear-gradient(135deg, #ffd400 0%, #ffc700 100%);
		color: #000;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.premium-notice {
		background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
		border: 2px solid #ffd400;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		margin-bottom: 2rem;
	}

	.premium-notice h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
	}

	.premium-notice p {
		margin: 0 0 1.5rem 0;
		color: #666;
	}

	.upgrade-button {
		display: inline-block;
		background: #ffd400;
		color: #000;
		padding: 0.75rem 2rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: transform 0.2s;
	}

	.upgrade-button:hover {
		transform: translateY(-2px);
	}

	form.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.settings-section {
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.settings-section h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.section-description {
		color: #666;
		font-size: 0.9rem;
		margin: 0 0 1.5rem 0;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	select,
	input[type='time'] {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
	}

	.checkbox-group {
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #f0f0f0;
	}

	.checkbox-group:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		cursor: pointer;
		padding: 0.75rem;
		border-radius: 8px;
		transition: background 0.2s;
	}

	.checkbox-label:hover {
		background: #f8f9fa;
	}

	.checkbox-label input[type='checkbox'] {
		margin-top: 0.25rem;
		width: 20px;
		height: 20px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.checkbox-content {
		flex: 1;
	}

	.checkbox-title {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.checkbox-description {
		font-size: 0.85rem;
		color: #666;
	}

	.time-picker {
		margin-top: 0.75rem;
		margin-left: 2rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.time-picker label {
		font-size: 0.9rem;
		color: #666;
		font-weight: normal;
	}

	.time-picker input {
		width: auto;
		padding: 0.5rem;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
	}

	.save-button {
		background: #ffd400;
		color: #000;
		border: none;
		padding: 0.75rem 2rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.save-button:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.save-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.save-message {
		padding: 0.5rem 1rem;
		border-radius: 8px;
		background: #50c878;
		color: #fff;
		font-weight: 600;
	}

	.save-message.error {
		background: #ff6b6b;
	}
</style>
