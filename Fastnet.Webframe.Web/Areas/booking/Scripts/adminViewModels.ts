/// <reference path="dwh/dwhbooking.ts" />
module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;


        export module admin {
            //export class models extends forms.models {
            //    current: parameters;
            //    original: parameters;
            //}
            //export class parameters extends forms.model {
            //    public AvailableGroups: IGroup[];
            //    public TermsAndConditionsUrl: string;
            //    public getObservable(): observableParameters {
            //        return new observableParameters(this);
            //    }
            //}
            //export class observableParameters extends forms.viewModel {
            //    public AvailableGroups: KnockoutObservableArray<IGroup>;
            //    public TermsAndConditionsUrl: string;
            //    constructor(model: parameters) {
            //        super();
            //        this.TermsAndConditionsUrl = model.TermsAndConditionsUrl;
            //        this.AvailableGroups = ko.observableArray(model.AvailableGroups);
            //        //model.AvailableGroups.forEach((o: IGroup, i: number, arr: IGroup[]) => {
            //        //    this.AvailableGroups.push(o);
            //        //});
            //    }
            //}
        }
    }
}