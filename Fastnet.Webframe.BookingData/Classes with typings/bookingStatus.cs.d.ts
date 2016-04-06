declare module server {
	const enum bookingStatus {
		WaitingApproval,
		WaitingPayment,
		Confirmed,
		Cancelled,
		WaitingGateway,
	}
}
