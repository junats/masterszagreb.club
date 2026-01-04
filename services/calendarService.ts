import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export class CalendarService {
    /**
     * Export custody events to iOS Calendar using .ics file
     * This approach works with Capacitor 7 and doesn't require additional plugins
     */
    static async syncToIOSCalendar(custodyDays: any[]): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            throw new Error('Calendar sync is only available on native platforms');
        }

        try {
            // Filter to only include current month + next 2 months
            const now = new Date();
            const threeMonthsLater = new Date();
            threeMonthsLater.setMonth(now.getMonth() + 3);

            const relevantDays = custodyDays.filter(day => {
                const dayDate = new Date(day.date);
                return dayDate >= now && dayDate <= threeMonthsLater && day.status !== 'none';
            });

            if (relevantDays.length === 0) {
                throw new Error('No custody days marked in the next 3 months. Mark some days in the calendar first (tap days to set custody status).');
            }

            // Generate ICS file content
            const icsContent = this.generateICS(relevantDays);

            // Save to filesystem using base64 encoding
            const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
            const fileName = `TrueTrack-Custody-${new Date().getTime()}.ics`;

            // Convert to base64
            const base64Content = btoa(unescape(encodeURIComponent(icsContent)));

            const result = await Filesystem.writeFile({
                path: fileName,
                data: base64Content,
                directory: Directory.Cache,
                encoding: Encoding.UTF8
            });

            // Share the file
            // Share the file
            await Share.share({
                title: 'TrueTrack Custody Calendar',
                files: [result.uri],
                dialogTitle: 'Add to Calendar'
            });

            console.log(`✅ Generated calendar file with ${relevantDays.length} events`);
        } catch (error) {
            console.error('Failed to sync to iOS Calendar:', error);
            throw error;
        }
    }

    /**
     * Generate ICS (iCalendar) file content
     */
    private static generateICS(custodyDays: any[]): string {
        const lines: string[] = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TrueTrack//Custody Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:TrueTrack Custody',
            'X-WR-TIMEZONE:UTC',
            'X-WR-CALDESC:Custody calendar events from TrueTrack'
        ];

        for (const day of custodyDays) {
            const date = new Date(day.date);
            const dateStr = this.formatICSDate(date);

            let title = 'Custody: ';
            if (day.status === 'me') {
                title += 'Me';
            } else if (day.status === 'partner') {
                title += 'Partner';
            } else if (day.status === 'split') {
                title += 'Split';
            }

            let description = '';
            if (day.activities && day.activities.length > 0) {
                description = 'Activities:\\n' + day.activities.map((a: any) =>
                    `- ${a.title}${a.startTime ? ` (${a.startTime}${a.endTime ? ` - ${a.endTime}` : ''})` : ''}`
                ).join('\\n');
            }

            // Generate unique ID for the event
            const uid = `${day.date}-${day.status}@truetrack.app`;

            lines.push('BEGIN:VEVENT');
            lines.push(`UID:${uid}`);
            lines.push(`DTSTAMP:${this.formatICSDate(new Date())}`);
            lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
            lines.push(`DTEND;VALUE=DATE:${dateStr}`);
            lines.push(`SUMMARY:${title}`);
            if (description) {
                lines.push(`DESCRIPTION:${description.replace(/\n/g, '\\n')}`);
            }
            lines.push('STATUS:CONFIRMED');
            lines.push('TRANSP:TRANSPARENT');
            lines.push('END:VEVENT');
        }

        lines.push('END:VCALENDAR');

        return lines.join('\r\n');
    }

    /**
     * Format date for ICS file (YYYYMMDD)
     */
    private static formatICSDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
}
