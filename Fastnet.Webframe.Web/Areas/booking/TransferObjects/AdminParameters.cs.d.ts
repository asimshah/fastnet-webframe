declare module server {
	interface IGroup {
		Id: number;
		Name: string;
	}
	interface AdminParameters {
		AvailableGroups: server.IGroup[];
	}
}
