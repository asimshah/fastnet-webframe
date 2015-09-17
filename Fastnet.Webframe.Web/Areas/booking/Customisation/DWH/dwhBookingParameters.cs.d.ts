/// <reference path="../../TransferObjects/bookingParameters.cs.d.ts" />

declare module server {
	interface dwhBookingParameters extends bookingParameters {
		noBMCCheckGroup: server.IGroup;
		shortBookingInterval: number;
	}
}
