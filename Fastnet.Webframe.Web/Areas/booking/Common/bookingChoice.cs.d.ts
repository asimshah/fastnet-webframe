/// <reference path="../TransferObjects/availabilityInfo.cs.d.ts" />

declare module server {
	interface accomodationItem {
		id: number;
		type: any;
		name: string;
		capacity: number;
	}
	interface bookingChoice {
		choiceNumber: number;
		totalCapacity: number;
		partySize: number;
		costs: server.dailyCostItem[];
		costsAreEqualEveryDay: boolean;
		totalCost: number;
		formattedCost: string;
		accomodationItems: server.accomodationItem[];
		description: string;
	}
	interface bookingRequest {
		fromDate: string;
		toDate: string;
		choice: server.bookingChoice;
		under18spresent: boolean;
		isPaid: boolean;
        phoneNumber: string;
        partySize: number;
	}
}
