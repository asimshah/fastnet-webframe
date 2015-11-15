declare module server {
	interface booking {
		bookingId: number;
		reference: string;
		statusName: string;
		status: any;
		memberId: string;
		memberName: string;
		memberEmailAddress: string;
		memberPhoneNumber: string;
		from: string;
		to: string;
		description: string;
		createdOn: string;
		partySize: number;
		totalCost: number;
		formattedCost: string;
		isPaid: boolean;
		canPay: boolean;
		notes: string;
		history: string;
		entryInformation: string;
		under18sInParty: boolean;
		numberOfNights: number;
		hasMultipleDays: boolean;
	}
}
