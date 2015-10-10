declare module server {
	interface booking {
		bookingId: number;
		reference: string;
		status: string;
		memberId: string;
		memberName: string;
		memberEmailAddress: string;
		memberPhoneNumber: string;
		from: string;
		to: string;
		createdOn: string;
		totalCost: number;
		formattedCost: string;
		isPaid: boolean;
		notes: string;
		entryInformation: string;
		under18sInParty: boolean;
		numberOfNights: number;
		hasMultipleDays: boolean;
	}
}
