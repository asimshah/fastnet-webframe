declare module server {
	const enum BookingPermissions {
		Disallowed,
		StandardBookingAllowed,
		ShortTermBookingAllowed,
		ShortTermBookingWithoutPaymentAllowed,
	}
	interface MemberInfo {
		Anonymous: boolean;
		MemberId: string;
		Fullname: string;
		FirstName: string;
		LastName: string;
		MobileNumber: string;
		BookingPermission: server.BookingPermissions;
		Explanation: string;
		OnBehalfOfMemberId: string;
	}
}
