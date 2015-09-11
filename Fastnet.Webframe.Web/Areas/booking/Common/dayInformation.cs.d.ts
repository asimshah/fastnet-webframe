/// <reference path="dailyAccomodation.cs.d.ts" />

declare module server {
	const enum DayStatus {
		IsClosed,
		IsFree,
		IsFull,
		IsPartBooked,
		IsNotBookable,
	}
	interface dayInformation {
		day: string;
		formattedDay: string;
		status: server.DayStatus;
		statusName: string;
		statusDescription: string;
		availabilitySummary: string;
		reportDetails: boolean;
		calendarPopup: string;
		accomodationDetails: server.dailyAccomodation;
	}
}
