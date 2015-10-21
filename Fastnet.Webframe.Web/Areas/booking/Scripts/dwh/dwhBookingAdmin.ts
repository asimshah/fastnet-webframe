module fastnet {
    import ajax = fastnet.util.ajax;
    import debug = fastnet.util.debug;
    import str = fastnet.util.str;
    import wt = fastnet.web.tools;
    import forms = fastnet.forms;
    import h$ = fastnet.util.helper;
    export interface entryCodeInfo {
        currentEntryCode: server.entryCode,
        validFrom: string,
        validTo: string,
        allCodes: server.entryCode[]
    }
    export module booking {
        export class dwhAdminIndex extends adminCustomIndex {
            public handleCommand(pf: forms.form, app: adminApp, cmd: string): boolean {
                var handled = false;
                switch (cmd) {
                    case "entry-codes":
                        handled = true;
                        pf.close();
                        var ec = new entryCodeApp(app);
                        ec.start();
                        break;
                }
                return handled;
            }
        }
        class entryCodeApp extends adminSubapp {
            constructor(app: adminApp) {
                super(app);
            }
            public start(): void {
                var url = "bookingadmin/get/entrycodes";
                ajax.Get({ url: url }, false).then((r: entryCodeInfo) => {
                    this.showForm(r);
                });
            }
            public showForm(info: entryCodeInfo) {
                var vm = new observableEntryCodeModel( new entryCodeModel(info));
                var ecform = new forms.form(this, {
                    modal: false,
                    title: "Entry Codes",
                    styleClasses: ["report-forms"],
                    cancelButtonText: "Administration page",
                    okButton: null,
                    additionalButtons: [
                        { text: "Home page", command: "back-to-site", position: forms.buttonPosition.left }
                    ]
                }, vm);
                var templateUrl = "booking/entrycodes";
                wt.getTemplate({ ctx: this, templateUrl: templateUrl }).then((r) => {
                    ecform.setContentHtml(r.template);
                    ecform.open((ctx: entryCodeApp, f: forms.form, cmd: string, data: entryCodeModels, ct: EventTarget) => {
                        switch (cmd) {
                            case "cancel-command":
                                f.close();
                                var index = new adminIndex(this.app);
                                index.start();
                                break;
                            case "back-to-site":
                                f.close();
                                location.href = "/home";
                                break;
                            case "remove-code":
                                var id = parseInt($(ct).closest("tr").attr("data-id"));
                                f.close();
                                this.removeCode(id).then(() => {
                                    this.start();
                                });
                                break;
                            case "add-code":
                                if (f.isValid()) {
                                    f.close();
                                    this.addCode(data.current).then(() => {
                                        this.start();
                                    });
                                }
                                break;
                        }
                    });
                });
            }
            public addCode(m: entryCodeModel): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var url = "bookingadmin/add/entrycode";
                var data = { from: m.applicableFrom, code: m.newCode };
                ajax.Post({ url: url, data: data }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
            public removeCode(id: number): JQueryPromise<void> {
                var deferred = $.Deferred<void>();
                var url = str.format("bookingadmin/remove/entrycode/{0}", id);                
                ajax.Post({ url: url, data: null }).then(() => {
                    deferred.resolve();
                });
                return deferred.promise();
            }
        }
    }
}