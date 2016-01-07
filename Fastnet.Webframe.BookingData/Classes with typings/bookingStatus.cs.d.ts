declare module server {
	const enum bookingStatus {
		WaitingApproval,
		WaitingPayment,
		Confirmed,
		AutoCancelled,
		Cancelled,
		WaitingGateway,
	}
}
