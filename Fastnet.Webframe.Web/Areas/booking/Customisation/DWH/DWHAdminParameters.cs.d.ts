/// <reference path="../../TransferObjects/AdminParameters.cs.d.ts" />

declare module server {
	interface DWHAdminParameters extends AdminParameters {
		NoBMCCheckGroup: server.IGroup;
	}
}
