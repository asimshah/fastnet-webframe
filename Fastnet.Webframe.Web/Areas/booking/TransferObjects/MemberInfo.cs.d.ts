declare module server {
	interface MemberInfo {
		Anonymous: boolean;
		MemberId: string;
		Fullname: string;
		BookingDisallowed: boolean;
		Explanation: string;
	}
}
