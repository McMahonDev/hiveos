/**
 * Get the abbreviated timezone name for the user's current timezone
 * @returns The timezone abbreviation (e.g., "PST", "EST") or full timezone name as fallback
 */
export function getTimeZoneAbbreviation(): string {
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const shortName = new Date()
		.toLocaleTimeString('en-US', { timeZoneName: 'short', timeZone })
		.split(' ')[2];
	return shortName || timeZone;
}
