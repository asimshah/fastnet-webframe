var PageToolbar = (function ($) {
    // this uses a javascript singleton pattern
    var $U = $.fastnet$utilities;
    var instance = null;

    function createInstance() {
        var handlers = {};
        function _isPageInformationOpen() {
            var pageInformation = $(".edit-panel .page-information");
            return pageInformation.hasClass("open");
        }
        function _togglePageInformation() {
            var pageInformation = $(".edit-panel .page-information");
            if (pageInformation.hasClass("closed")) {
                pageInformation.removeClass("closed").addClass("open");
            } else {
                pageInformation.removeClass("open").addClass("closed");
            }
        }
        function _enableCommand(cmd) {
            var selector = $U.Format(".edit-toolbar button[data-cmd='{0}']", cmd);
            $U.SetEnabled($(selector), true);
        }
        function _disableCommand(cmd) {
            var selector = $U.Format(".edit-toolbar button[data-cmd='{0}']", cmd);
            $U.SetEnabled($(selector), false);
        }
        function _addHandler(cmd, handler) {
            handlers[cmd] = handler;
        }
        function _onCommand(cmd) {
            if (cmd === "page-info-command") {
                var target = $(".edit-toolbar button[data-cmd='page-info-command']");
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
            $(".edit-panel").removeClass("up").addClass("down");
            $(".edit-toolbar").addClass("present");
            $(".edit-panel").off("click");
            _onCommand("toolbar-opened");
        }
        function _show() {
            $(".edit-panel").removeClass("down").addClass("up");
            $(".edit-toolbar").removeClass("present");
            $(".edit-panel").on("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                _open();
            });
        }
        function _hide() {
            $(".edit-panel").removeClass("down").removeClass("up");
            $(".edit-toolbar").removeClass("present");
        }
        $(".edit-toolbar button[data-cmd]").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var cmd = $(this).attr("data-cmd");
            _onCommand(cmd);
        });
        $(".edit-panel").removeClass("down").removeClass("up");
        $(".edit-toolbar").removeClass("present");
        return {
            hide: _hide,
            show: _show,
            open: _open,
            close: _show,
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