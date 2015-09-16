declare module server {
	interface IGroup {
		Id: number;
		Name: string;
	}
	interface abode {
		id: number;
		name: string;
	}
	interface bookingParameters {
		factoryName: string;
		availableGroups: server.IGroup[];
		termsAndConditionsUrl: string;
		paymentGatewayAvailable: boolean;
		maximumOccupants: number;
		currentAbode: server.abode;
		abodes: server.abode[];
		today: string;
	}
}
