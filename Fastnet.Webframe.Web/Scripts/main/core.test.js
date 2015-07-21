var Tester = (function ($) {
    Tester._s = {
        instances: 0
    };
    function Tester() {
        this._instance = Tester._s.instances++;
    }
    var $U = $.fastnet$utilities;

    function private1(value) {

    }
    function private2() {
        $U.Debug("This is instance {0} of {1} instances", this._instance,  Tester._s.instances);
    }
    Tester.prototype.print = function () {
        private2.call(this);
    }

    return Tester;
    //return {
    //    methodA: private1,
    //    print: private2
    //};
})(jQuery);
//
(function ($) {
    $(".toolbar button.testing-command").on("click", function (e) {
        var m1 = Menu.get();
        var m2 = Menu.get();
        m2.traceInstance();
        m1.traceInstance();
        debugger;
    });
})(jQuery);

