export function isPast(dateString: string, timeString?: string): boolean {
	if (!dateString) return false;

	// Parse the date string as a local date to avoid timezone issues
	const isoDateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	let eventDate: Date;

	if (isoDateMatch) {
		const y = Number(isoDateMatch[1]);
		const m = Number(isoDateMatch[2]) - 1; // Month is 0-indexed
		const d = Number(isoDateMatch[3]);
		eventDate = new Date(y, m, d);
	} else {
		eventDate = new Date(dateString);
	}

	// If time is provided, set it on the event date
	if (timeString && timeString.trim() !== '') {
		const [hours, minutes] = timeString.split(':').map(Number);
		if (!isNaN(hours) && !isNaN(minutes)) {
			eventDate.setHours(hours, minutes, 0, 0);
		}
	} else {
		// If no time provided, set to end of day for comparison
		eventDate.setHours(23, 59, 59, 999);
	}

	// Get current date and time
	const now = new Date();

	// Check if event date/time is before now
	return eventDate < now;
}
