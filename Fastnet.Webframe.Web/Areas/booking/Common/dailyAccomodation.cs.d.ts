declare module server {
	interface dailyAccomodation {
		name: string;
		isBookable: boolean;
		isBlocked: boolean;
		isAvailableToBook: boolean;
		isBooked: boolean;
		bookingReference: string;
		subAccomodation: server.dailyAccomodation[];
	}
	interface extendedDailyAccomodation extends dailyAccomodation {
		memberName: string;
		memberEmailAddress: string;
		mobilePhoneNumber: string;
	}
}
