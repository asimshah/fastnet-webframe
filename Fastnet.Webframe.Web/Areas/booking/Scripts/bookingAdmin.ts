module fastnet {
    import ajax = fastnet.util.ajax;
    import debug = fastnet.util.debug;
    import str = fastnet.util.str;
    import wt = fastnet.web.tools;
    import forms = fastnet.forms;
    import h$ = fastnet.util.helper;
    class configuration {

        public static getFormStyleClasses(): string[] {
            return ["booking-forms"];
        }
    }
    export module booking {
        export class adminApp  {
            public bookingParameters: server.BookingParameters;
            public start(): void {                
                this.initialise().then(() => {
                    var index = new adminIndex();
                    index.start();
                });
            }
            private initialise(): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var config: forms.configuration = {
                    modelessContainer: "admin-interaction",
                };
                forms.form.initialise(config);
                var parametersUrl = "bookingapi/parameters";
                ajax.Get({ url: parametersUrl }, false).then((r) => {
                    this.bookingParameters = <server.BookingParameters>r;
                    factory.setFactory(this.bookingParameters.FactoryName);
                    deferred.resolve();
                });
                return deferred.promise();
            }
        }
        class adminIndex  {   
            public start(): void {
                debug.print("admin index started");
                var aiForm = new forms.form(this, {
                    modal: false,
                    title: "Booking Administration",
                    styleClasses: configuration.getFormStyleClasses(),
                    cancelButtonText: "Home page",
                    okButton: null
                }, null);
                var adminIndexFormTemplateUrl = "booking/adminIndex";
                wt.getTemplate({ ctx: this, templateUrl: adminIndexFormTemplateUrl }).then((r) => {
                    aiForm.setContentHtml(r.template);
                    aiForm.open((ctx: adminIndex, f: forms.form, cmd: string, data: any) => {
                        switch (cmd) {
                            case "cancel-command":
                                f.close();
                                location.href = "/home";
                                break;
                            case "edit-configuration":
                                f.close();
                                var ci = new configIndex();
                                ci.start();
                                break;
                            default:
                                forms.messageBox.show("This feature not yet implemented").then(() => { });
                                break;
                        }
                    });
                });
            }
        }
        class configIndex { 
            public start(): void {
                debug.print("configuration index started");
                var ciForm = new forms.form(this, {
                    modal: false,
                    title: "Booking Configuration",
                    styleClasses: configuration.getFormStyleClasses(),
                    cancelButtonText: "Administration page",
                    okButton: null,
                    additionalButtons: [
                        {text: "Home page", command: "back-to-site", position: forms.buttonPosition.left}
                    ]
                }, null);
                var configurationIndexFormTemplateUrl = "booking/configurationIndex";
                wt.getTemplate({ ctx: this, templateUrl: configurationIndexFormTemplateUrl }).then((r) => {
                    ciForm.setContentHtml(r.template);
                    ciForm.open((ctx: configIndex, f: forms.form, cmd: string, data: any) => {
                        switch (cmd) {
                            case "cancel-command":
                                f.close();
                                var index = new adminIndex();
                                index.start();
                                break;
                            case "back-to-site":
                                f.close();
                                location.href = "/home";
                                break;
                            case "edit-parameters":
                                f.close();
                                var pf = new parametersApp();
                                pf.start();
                                break;
                            default:
                                forms.messageBox.show("This feature not yet implemented").then(() => { });
                                break;
                        }
                    });
                });
            }
        }
        class parametersApp {
            public start(): void {
                debug.print("configuration index started");
                var model = factory.getParametersVM();
                var url = "bookingadmin/parameters";
                ajax.Get({ url: url }, false).then((r: server.AdminParameters) => {
                    model.setFromJSON(r);
                    var vm = model.getObservable();
                    this.showForm(vm);
                });
            }
            public showForm(vm: adminVM.observableParameters) {
                var paraForm = new forms.form(this, {
                    modal: false,
                    title: "Parameters",
                    styleClasses: configuration.getFormStyleClasses(),
                    okButtonText: "Save changes",
                    cancelButton: null,
                    additionalButtons: [
                        { text: "Home page", command: "back-to-site", position: forms.buttonPosition.left },
                        { text: "Configuration page", command: "configuration-page", position: forms.buttonPosition.left }
                    ]
                }, vm);
                var configurationIndexFormTemplateUrl = "booking/parameters";
                wt.getTemplate({ ctx: this, templateUrl: configurationIndexFormTemplateUrl }).then((r) => {
                    paraForm.setContentHtml(r.template);
                    paraForm.open((ctx: configIndex, f: forms.form, cmd: string, data: adminVM.models) => {
                        switch (cmd) {
                            case "configuration-page":
                                f.close();
                                var index = new configIndex();
                                index.start();
                                break;
                            case "back-to-site":
                                f.close();
                                location.href = "/home";
                                break;
                            case "ok-command":
                                this.saveParameters(f, data);
                                break;
                            default:
                                forms.messageBox.show("This feature not yet implemented");//.then(() => { });
                                break;
                        }
                    });
                });
            }
            public saveParameters(f: forms.form, models: adminVM.models): void {
                var url = "bookingadmin/save/parameters";
                ajax.Post({ url: url, data: models.current }).then((r) => {
                    f.setMessage("Changes saved");
                });
            }
        }
    }
}
