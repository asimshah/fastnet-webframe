var PageToolbar = (function ($) {
    // this uses a javascript singleton pattern
    var $U = $.fastnet$utilities;
    var instance = null;

    function createInstance() {
        var handlers = {};
        function _closeToolbar() {
            _deactivateToolbarShim();
            _closePageInformation();
            $(".edit-panel .toolbar").removeClass("open").removeClass("available").addClass("closed");
        }
        function _setToolbarAvailable() {
            $(".edit-panel .toolbar").removeClass("open").removeClass("closed").addClass("available");
            _closePageInformation();
            _activateToolbarShim();
        }
        function _setToolbarOpen() {
            _deactivateToolbarShim();
            $(".edit-panel .toolbar").removeClass("available").removeClass("closed").addClass("open");
        }
        function _activateToolbarShim() {
            $(".edit-panel").on("click", function (e) {
                e.preventDefault();
                //e.stopPropagation();
                _open();
            });
        }
        function _deactivateToolbarShim() {
            $(".edit-panel").off("click");
        }
        function _isPageInformationOpen() {
            var pageInformation = $(".edit-panel .page-information");
            return pageInformation.hasClass("open");
        }
        function _openPageInformation() {
            $(".edit-panel .page-information").removeClass("closed").addClass("open");
            //$(".edit-panel").removeClass("down").addClass("full");
        }
        function _closePageInformation() {
            $(".edit-panel .page-information").removeClass("open").addClass("closed");
            
        }
        function _togglePageInformation() {
            var pageInformation = $(".edit-panel .page-information");
            if (pageInformation.hasClass("closed")) {
                _openPageInformation();
                //pageInformation.removeClass("closed").addClass("open");
                //$(".edit-panel").removeClass("down").addClass("full");
            } else {
                _closePageInformation();
                //pageInformation.removeClass("open").addClass("closed");
                //$(".edit-panel").removeClass("full").addClass("down");
            }
        }
        function _enableCommand(cmd) {
            var selector = $U.Format(".toolbar button[data-cmd='{0}']", cmd);
            $U.SetEnabled($(selector), true);
        }
        function _disableCommand(cmd) {
            var selector = $U.Format(".toolbar button[data-cmd='{0}']", cmd);
            $U.SetEnabled($(selector), false);
        }
        function _addHandler(cmd, handler) {
            //if (typeof handlers[cmd] === "undefined" || handlers[cmd] === null) {
            //    debugger;
            //}
            handlers[cmd] = handler;
        }
        function _onCommand(cmd) {
            if (cmd === "page-info-command") {
                var target = $(".toolbar button[data-cmd='page-info-command']");
                if (target.hasClass("closed")) {
                    target.removeClass("closed").addClass("open");
                    target.find("span:first-child").text("Less Info");
                } else {
                    target.removeClass("open").addClass("closed");
                    target.find("span:first-child").text("More Info");
                }
                _togglePageInformation();
            }
            if (handlers[cmd]) {
                handlers[cmd]();
            }
        }
        function _open() {
            // $(".edit-panel").removeClass("up").addClass("down");
            _setToolbarOpen();
            //$(".edit-toolbar").addClass("present");
            //$(".edit-panel").off("click");
            _onCommand("toolbar-opened");
        }
        function _show() {
            _setToolbarAvailable();
            //_closeToolbar();
            //_closePageInformation();
            //$(".edit-panel").removeClass("down").addClass("up");
            //$(".edit-toolbar").removeClass("present");
            //$(".edit-panel").on("click", function (e) {
            //    e.preventDefault();
            //    e.stopPropagation();
            //    _open();
            //});
        }
        function _hide() {
            _closeToolbar();
            //$(".edit-panel").removeClass("down").removeClass("up");
            //$(".edit-toolbar").removeClass("present");
        }
        $(".toolbar button[data-cmd]").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var cmd = $(this).attr("data-cmd");
            _onCommand(cmd);
        });
        _closeToolbar();
        //$(".edit-panel").removeClass("down").removeClass("up");
        //$(".edit-toolbar").removeClass("present");
        return {
            hide: _hide,
            show: _show,
            open: _open,
            close: _show, // careful, to callers close() and show() do the same thing!
            addHandler: _addHandler,
            enableCommand: _enableCommand,
            disableCommand: _disableCommand,
            isPageInformationOpen: _isPageInformationOpen
        };
    }
    function getInstance() {
        if (!instance) {
            instance = new createInstance();
        }
        return instance;
    }
    return {
        get: getInstance       
    }
})(jQuery);