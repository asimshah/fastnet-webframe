var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var fastnet;
(function (fastnet) {
    var ajax = fastnet.util.ajax;
    var str = fastnet.util.str;
    var wt = fastnet.web.tools;
    var forms = fastnet.forms;
    var booking;
    (function (booking) {
        var dwhAdminIndex = (function (_super) {
            __extends(dwhAdminIndex, _super);
            function dwhAdminIndex() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            dwhAdminIndex.prototype.handleCommand = function (pf, app, cmd) {
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
            };
            return dwhAdminIndex;
        }(booking.adminCustomIndex));
        booking.dwhAdminIndex = dwhAdminIndex;
        var entryCodeApp = (function (_super) {
            __extends(entryCodeApp, _super);
            function entryCodeApp(app) {
                return _super.call(this, app) || this;
            }
            entryCodeApp.prototype.start = function () {
                var _this = this;
                var url = "bookingadmin/get/entrycodes";
                ajax.Get({ url: url }, false).then(function (r) {
                    _this.showForm(r);
                });
            };
            entryCodeApp.prototype.showForm = function (info) {
                var _this = this;
                var vm = new booking.observableEntryCodeModel(new booking.entryCodeModel(info));
                var ecform = new forms.form(this, {
                    modal: false,
                    title: "Entry Codes",
                    styleClasses: ["report-forms"],
                    cancelButtonText: "Administration page",
                    okButton: null,
                    additionalButtons: [
                        { text: "Home page", command: "back-to-site", position: 1 /* left */ }
                    ]
                }, vm);
                var templateUrl = "booking/entrycodes";
                wt.getTemplate({ ctx: this, templateUrl: templateUrl }).then(function (r) {
                    ecform.setContentHtml(r.template);
                    ecform.open(function (ctx, f, cmd, data, ct) {
                        switch (cmd) {
                            case "cancel-command":
                                f.close();
                                var index = new booking.adminIndex(_this.app);
                                index.start();
                                break;
                            case "back-to-site":
                                f.close();
                                location.href = "/home";
                                break;
                            case "remove-code":
                                var id = parseInt($(ct).closest("tr").attr("data-id"));
                                f.close();
                                _this.removeCode(id).then(function () {
                                    _this.start();
                                });
                                break;
                            case "add-code":
                                if (f.isValid()) {
                                    f.close();
                                    _this.addCode(data.current).then(function () {
                                        _this.start();
                                    });
                                }
                                break;
                        }
                    });
                });
            };
            entryCodeApp.prototype.addCode = function (m) {
                var deferred = $.Deferred();
                var url = "bookingadmin/add/entrycode";
                var data = { from: m.applicableFrom, code: m.newCode };
                ajax.Post({ url: url, data: data }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            entryCodeApp.prototype.removeCode = function (id) {
                var deferred = $.Deferred();
                var url = str.format("bookingadmin/remove/entrycode/{0}", id);
                ajax.Post({ url: url, data: null }).then(function () {
                    deferred.resolve();
                });
                return deferred.promise();
            };
            return entryCodeApp;
        }(booking.adminSubapp));
    })(booking = fastnet.booking || (fastnet.booking = {}));
})(fastnet || (fastnet = {}));
//# sourceMappingURL=dwhBookingAdmin.js.map