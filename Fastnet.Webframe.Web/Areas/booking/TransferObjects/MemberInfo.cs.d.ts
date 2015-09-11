declare module server {
	const enum BookingPermissions {
		Disallowed,
		WithoutConfirmation,
		WithConfirmation,
	}
	interface MemberInfo {
		Anonymous: boolean;
		MemberId: string;
		Fullname: string;
		BookingPermission: server.BookingPermissions;
		Explanation: string;
		OnBehalfOfMemberId: string;
	}
}
