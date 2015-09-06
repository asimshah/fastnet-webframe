/// <reference path="dwh/dwhbooking.ts" />
module fastnet {
    export module booking {
        import forms = fastnet.forms;
        import str = fastnet.util.str;
        import h$ = fastnet.util.helper;

        export interface IGroup {
            Id: number;
            Name: string;
        }
        export module adminVM {
            export class models extends forms.models {
                current: parameters;
                original: parameters;
            }
            export class parameters extends forms.model {
                public AvailableGroups: IGroup[];
                public getObservable(): observableParameters {
                    return new observableParameters(this);
                }
            }
            export class observableParameters extends forms.viewModel {
                public AvailableGroups: KnockoutObservableArray<IGroup>;
                constructor(model: parameters) {
                    super();
                    this.AvailableGroups = ko.observableArray(model.AvailableGroups);
                    //model.AvailableGroups.forEach((o: IGroup, i: number, arr: IGroup[]) => {
                    //    this.AvailableGroups.push(o);
                    //});
                }
            }
        }
    }
}