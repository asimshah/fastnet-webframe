/// <reference path="../../TransferObjects/bookingParameters.cs.d.ts" />

declare module server {
	interface dwhBookingParameters extends bookingParameters {
		nonBMCMembers: server.IGroup;
		privilegedMembers: server.IGroup;
		paymentInterval: number;
		entryCodeNotificationInterval: number;
        entryCodeBridgeInterval: number;
        cancellationInterval: number;
        firstReminderInterval: number;
        secondReminderInterval: number;
        reminderSuppressionInterval: number;
	}
}
