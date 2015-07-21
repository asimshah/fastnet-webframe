var Tester = (function () {
    function Tester() {
        Tester.instances++;
        this.instance = Tester.instances;
    }
    Tester.prototype.inner = function () {
    };
    Tester.prototype.print = function () {
        console.log(this.instance);
    };
    Tester.prototype.print2 = function () {
        console.log("");
    };
    return Tester;
})();
//# sourceMappingURL=test2.js.map
