declare module server {
	interface abode {
		id: number;
		name: string;
	}
	interface bookingParameters {
		factoryName: string;
		maximumOccupants: number;
		currentAbode: server.abode;
		abodeList: server.abode[];
	}
}
