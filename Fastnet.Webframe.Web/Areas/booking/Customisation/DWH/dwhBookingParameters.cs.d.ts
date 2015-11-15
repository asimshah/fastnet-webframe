/// <reference path="../../TransferObjects/bookingParameters.cs.d.ts" />

declare module server {
	interface dwhBookingParameters extends bookingParameters {
		nonBMCMembers: server.IGroup;
		privilegedMembers: server.IGroup;
		shortBookingInterval: number;
	}
}
