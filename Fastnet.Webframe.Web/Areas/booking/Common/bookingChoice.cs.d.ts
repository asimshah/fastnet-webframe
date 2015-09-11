/// <reference path="../TransferObjects/availabilityInfo.cs.d.ts" />

declare module server {
	interface accomodationItem {
		type: any;
		name: string;
		capacity: number;
	}
	interface bookingChoice {
		selected: boolean;
		totalCapacity: number;
		costs: server.dailyCostItem[];
		costsAreEqualEveryDay: boolean;
		totalCost: number;
		accomodationItems: server.accomodationItem[];
		description: string;
	}
}
