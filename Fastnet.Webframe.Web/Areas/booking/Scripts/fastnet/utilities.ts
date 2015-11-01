/// <reference path="../../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../../scripts/typings/moment/moment.d.ts" />


module fastnet {
    interface templateRequest {
        ctx: any;
        templateUrl: string;
    }
    interface templateResult extends templateRequest {
        template: string;
    }
    export module force {
        export class dark {
            public test(): void {
                fastnet.util.debug.print("star wars");
            }
        }
    }
    export module web {
        //import ajax = fastnet.util.ajax;
        export class tools {
            public static getTemplate(request: templateRequest): JQueryPromise<templateResult> {
                var url = "template/get/" + request.templateUrl;
                var deferred = $.Deferred<templateResult>();
                $.when(fastnet.util.ajax.Get({ url: url })).then((r) => {
                    var template = r.Template;
                    deferred.resolve({ ctx: request.ctx, templateUrl: request.templateUrl, template: template });
                });
                return deferred.promise();
            }
        }
    }
    export module util {
        class utilOnReady {
            public static init(): void {

            }
        }

        export class ajax {
            private static rootUrl: string = "/";
            public static init(url: string) {
                this.rootUrl = url;
                util.debug.print("rootUrl is {0}", this.rootUrl);
                $(document).ajaxError(this.ajaxError);
            }
            public static Get(args: JQueryAjaxSettings, cache: boolean = true): JQueryXHR {
                return $.ajax({
                    url: this.rootUrl + args.url,
                    contentType: "application/json",
                    type: "GET",
                    cache: cache,
                });
            }
            public static Post(args: { url: string, data: any }) {
                return $.ajax({
                    url: this.rootUrl + args.url,
                    contentType: "application/json; charset=UTF-8",
                    type: "POST",
                    data: JSON.stringify(args.data)
                });
            }
            private static ajaxError(event, jqXHR, settings, thrownError) {
                var errorMessage = util.str.format("Internal error\nCall to \"{0}\" failed: {1}", settings.url, thrownError);
                util.debug.print(errorMessage);
                // how to call a system form here? alert()??
                alert(errorMessage);
            }
        }
        export class str {
            public static format(fmt: string, ...args: any[]): string {
                var i;
                var text;
                if (args instanceof Array) {
                    for (i = 0; i < args.length; i++) {
                        text = args[i];
                        fmt = fmt.replace(new RegExp('\\{' + i + '\\}', 'gm'), text);
                    }
                    return fmt;
                }
                for (i = 0; i < arguments.length - 1; i++) {
                    text = arguments[i + 1];
                    fmt = fmt.replace(new RegExp('\\{' + i + '\\}', 'gm'), text);
                }
                return fmt;
            }
            public static toMoment(d: string | Date): moment.Moment {
                if (typeof d === "string") {
                    if (d.length === 19 && d.indexOf('T') === 10) {
                        // is an isoDate?
                        return moment(d);
                    } else {
                        return moment(d, "DDMMMYYYY");
                    }
                } else {
                    return moment(d);
                }
            }
            public static toDate(d: Date | moment.Moment | string): Date {
                if (d instanceof Date) {
                    return d;
                } else {
                    var md: moment.Moment;
                    if (typeof d === "string") {
                        md = this.toMoment(d);
                    } else {
                        md = <moment.Moment>d;
                        
                    }
                    return md.toDate();
                }
            }
            public static toDateString(d: Date | moment.Moment | string): string {
                var md: moment.Moment;
                if (typeof d === "string") {
                    md = this.toMoment(d);
                } else {
                    if (d instanceof Date) {
                        md = moment(d);
                    } else {
                        md = <moment.Moment>d;
                    }
                }
                return md.format("DDMMMYYYY");
            }
        }
        export class debug {
            public static routeMessagesToVisualStudio = false;
            public static print(str: string, ...args: any[]) {
                var message = util.str.format.apply(this, arguments);
                if (debug.routeMessagesToVisualStudio) {
                    if (window.hasOwnProperty('Debug')) {
                        var x = window['Debug'];
                        x.writeln(message);
                    } else {
                        console.log(message);
                    }
                }
                else {
                    console.log(message);
                }
            }
        }
        export class helper {
            private static nameSpace = "fastnet-";
            public static setLocalData(key: string, value: string): void {
                if (!helper.isNullOrUndefined(localStorage)) {
                    localStorage.setItem(helper.nameSpace + key, value);
                }
            }
            public static getLocalData(key: string): string {
                if (!helper.isNullOrUndefined(localStorage)) {
                    return localStorage.getItem(helper.nameSpace + key);
                }
                return null;
            }
            public static clearLocalData(key: string): void {
                if (!helper.isNullOrUndefined(localStorage)) {
                    return localStorage.removeItem(helper.nameSpace + key);
                }
            }
            public static clearLocalStorage(): void {
                if (!helper.isNullOrUndefined(localStorage)) {
                    return localStorage.clear();
                }
            }
            public static isNullOrUndefined(obj: any): boolean {
                return obj === null || obj === undefined;
            }
        }
        utilOnReady.init();
    }
}