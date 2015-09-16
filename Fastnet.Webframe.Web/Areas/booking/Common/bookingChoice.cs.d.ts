/// <reference path="../TransferObjects/availabilityInfo.cs.d.ts" />

declare module server {
	interface accomodationItem {
		type: any;
		name: string;
		capacity: number;
	}
	interface bookingChoice {
		choiceNumber: number;
		totalCapacity: number;
		costs: server.dailyCostItem[];
		costsAreEqualEveryDay: boolean;
		totalCost: number;
		accomodationItems: server.accomodationItem[];
		description: string;
	}
}
