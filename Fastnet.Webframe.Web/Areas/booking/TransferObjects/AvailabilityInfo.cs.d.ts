/// <reference path="../Common/bookingChoice.cs.d.ts" />

declare module server {
	interface dailyCostItem {
		day: Date;
		cost: number;
	}
	interface availabilityInfo {
		success: boolean;
		explanation: string;
		choices: server.bookingChoice[];
	}
}
