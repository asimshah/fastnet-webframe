/// <reference path="../../../scripts/typings/jquery/jquery.d.ts" />


module fastnet {
    export module util {
        export class ajax {
            private static rootUrl: string = "/";
            public static init(url: string) {
                this.rootUrl = url;
                util.debug.print("rootUrl is {0}", this.rootUrl);
                $(document).ajaxError(this.ajaxError);
            }
            public static Get(args: JQueryAjaxSettings, cache: boolean = true) : JQueryXHR {
                //var cache = true;
                //if (typeof noCache !== "undefined") {
                //    cache = !noCache;
                //}
                return $.ajax({
                    url: this.rootUrl + args.url,
                    contentType: "application/json",
                    type: "GET",
                    cache: cache,
                });
            }
            public static Post(args) {
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
        }
        export class debug {
            public static print(str: string, ...args: any[]) {
                var message = util.str.format.apply(this, arguments);
                console.log(message);
                //if (window.hasOwnProperty('Debug')) {
                //    var x = window['Debug'];
                //    x.writeln(message);
                //} else {
                //    console.log(message);
                //}
            }
        }
    }
}