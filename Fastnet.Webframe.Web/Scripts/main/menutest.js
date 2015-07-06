$(function () {
    $U = $.fastnet$utilities;
    $U.Debug("menutest.js executing");
    var rootId = "#menu-0";
    function _displayRectangles() {
        function _logRectangles(element) {
            var el = $(element);
            var id = el.attr("id");
            var parentId = el.parent().attr("id");
            var label = "";
            if (el.hasClass("menu-item")) {
                label = el.find("> a").text();
            }
            // jquery outerWidth(true) and outerheight(true) includes margins (because parameter is true)
            // but includes padding and border
            var ohwm = el.outerHeight(true);
            var owwm = el.outerWidth(true);
            //getBoundingClientRect excludes margin
            // but includes padding and border
            var rect = el[0].getBoundingClientRect();
            var offset = el.offset();
            //$U.Debug("Element {0}[parent={6}] \"{5}\": width: {1}, height: {2} (also w {3} h {4})",
            //    id, w, h, rect.width, rect.height, label, parentId);
            $U.Debug("#{0}[^{1}] {2}", id, parentId, label);
            $U.Debug("\t\t({0},{1}) w:{2}, h:{3}", offset.left, offset.top, owwm, ohwm);
            
            //debugger;
        }
        _logRectangles(rootId);
        $(rootId).find("div").each(function (i, element) {
            _logRectangles(element);
        });

    }
    _displayRectangles();
});