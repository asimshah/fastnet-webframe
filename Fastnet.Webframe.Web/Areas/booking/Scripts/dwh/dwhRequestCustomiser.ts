module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;
        import debug = fastnet.util.debug;
        //export class dwhTest extends testBase {
        //    public method1(): void {
        //        debugger;
        //    }
        //}
        export class dwhRequestCustomiser extends requestCustomiser {
            //constructor() {
            //    super();
            //}
            public customise_Step1(stepObservable: observableRequest_step1): void {
                stepObservable.startDate.subscribe((sd) => {
                    var sdm = stepObservable.toMoment(sd);
                    var edm = stepObservable.toMoment(stepObservable.endDate());
                    var duration = (edm === null) ? 0 : edm.diff(sdm, "days");
                    var dayOfWeek = sdm.day();
                    
                    if (dayOfWeek === 5 && duration < 2) {
                        //edChangeFocusBlocked = true;
                        stepObservable.endDate(sdm.add(2, 'd').toDate());
                        //edChangeFocusBlocked = false;
                    }
                });
            }
        }
    }
}