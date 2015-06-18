
class Tester {
    //static $U = $.fastnet$utilities;
    static instances: number;
    private instance: number;
    constructor() {
        Tester.instances++;
        this.instance = Tester.instances;
    }
    public inner() {
    }
    print() {
        console.log(this.instance);
    }
    print2() {
        console.log("");
    }
}