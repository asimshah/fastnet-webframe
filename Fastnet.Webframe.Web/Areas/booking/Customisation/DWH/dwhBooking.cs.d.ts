declare module server {
	interface dwhBooking extends booking {
		bmcMembership: string;
		organisation: string;
		memberIsPrivileged: boolean;
	}
}
