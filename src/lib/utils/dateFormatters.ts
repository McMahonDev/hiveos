/**
 * Format a date string for display, handling timezone issues
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
	if (!dateString) return '';

	const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (match) {
		const [_, y, m, d] = match;
		const date = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
		return date.toLocaleDateString();
	}
	return new Date(dateString).toLocaleDateString();
}

/**
 * Format a time string in 12-hour format
 * @param time - Time in HH:MM format
 * @param timezone - Timezone string (currently unused but kept for future use)
 * @returns Formatted time string
 */
export function formatTime(time: string, timezone?: string): string {
	if (!time) return '';
	const [hours, minutes] = time.split(':');
	const hour = parseInt(hours);
	const ampm = hour >= 12 ? 'PM' : 'AM';
	const displayHour = hour % 12 || 12;
	return `${displayHour}:${minutes} ${ampm}`;
}
