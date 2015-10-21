declare module server {
	interface blockedPeriod {
		availabilityId: number;
		startsOn: Date;
		endsOn: Date;
		remarks: string;
	}
	interface bookingAvailability {
		bookingOpen: boolean;
		blockedPeriods: server.blockedPeriod[];
	}
}
