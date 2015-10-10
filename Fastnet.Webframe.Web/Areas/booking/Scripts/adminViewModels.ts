/// <reference path="dwh/dwhbooking.ts" />
module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;
        export class observableBooking extends forms.viewModel {
            public bookingId: number;
            public reference: string;
            constructor(b: server.booking) {
                super();
                this.bookingId = b.bookingId;
                this.reference = b.reference;
            }
        }
    }
}