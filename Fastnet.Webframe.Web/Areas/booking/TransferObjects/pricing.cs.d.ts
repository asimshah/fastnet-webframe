declare module server {
	interface pricing {
		priceId: number;
		amount: number;
		isRolling: boolean;
		from: Date;
		to: Date;
	}
}
