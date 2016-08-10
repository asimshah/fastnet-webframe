namespace fastnet {
    "use strict";
    export interface menuNameless {
        Index: number;
        Text: string; // menu label
        Url: string; // menu hyperlink
        Submenus: menuNameless[];
    }
    export interface menuOptions {
        menuClasses: string[];
    }
    interface menuItem {
        panelId: string,
        id: string,
        index: number,
        text: string,
        url: string,
        box: box
    }
    interface panel {
        id: string,
        parentId: string,
        level: number,
        visible: boolean,
        menuItems: menuItem[],
        box: box
    }
    interface box {
        coords: any;
        container_offset: any;
        mwidth: number;
        mheight: number;
        width: number;
        height: number;
    }
    export class Menu {
        private static instances: Menu[] = [];
        private container: string; // typically a panel selector like .MenuPanel
        private menuId: string = null;
        private menuBox: box = null;
        private panels: panel[] = [];
        private parkedHTML: string = null;
        private menuNumber: number = null;
        private menuClasses: string[] = null;
        private direction: string = "horizontal";
        constructor() {
            this.menuNumber = Menu.instances.length;
            //this.menuId = `${this.menuNumber}`;
            Menu.instances.push(this);
        }
        public create(selector: string, md: menuNameless[], options: menuOptions): string {
            this.container = selector;
            this.menuClasses = options.menuClasses;
            this.menuId = `menu-${this.menuNumber}`;
            this.parseMenuData(this.menuId, md);
            let menu2Html = this.createMenuHtml(this.menuId);
            if ($(this.container).find(".menu-location").length > 0) {
                $(this.container).find(".menu-location").append(menu2Html);
            } else {
                $(this.container).append($(menu2Html));
            }
            let rootPanel = this.findPanelByParentId(this.menuId);
            this.showPanel(rootPanel, () => {
                this.discoverStartingDimensions();
            });
            $("body").on("click", () => {
                this.closeOpenPanels();
            });
            return this.menuId;
        }
        public showBox(tagId: string): string {
            return this.box2String(tagId, this.getBox(tagId));
        }
        public park() {
            this.parkedHTML = $("#" + this.menuId)[0].outerHTML;
            $("#" + this.menuId).remove();
        }
        public restore() {
            if ($(this.container).find(".menu-location").length > 0) {
                $(this.container).find(".menu-location").append(this.parkedHTML);
            } else {
                $(this.container).append($(this.parkedHTML));
            }
            this.parkedHTML = null;
        }
        public getId(): string {
            return this.menuId;
        }
        private parsePanel(containerId: string, parentId: string, level: number, list: menuNameless[], pn: number, min: number) {
            let panelId = `${containerId}-mp-${pn++}`;// $U.Format("{0}-mp-{1}", containerId, pn++);
            let panel: panel = { id: panelId, parentId: parentId, level: level, visible: false, menuItems: [], box: null };
            $.each(list, (i, item) => {
                // item.Index, item.Text, item.Url, item.Submenus
                // each array of these is in a panel                    
                let id = `${panelId}-mi-${min++}`;// $U.Format("{0}-mi-{1}", panelId, min++);
                panel.menuItems.push({
                    panelId: panelId,
                    id: id,
                    index: item.Index,
                    text: item.Text,
                    url: item.Url,
                    box: null
                    //menuItemTotal: item.Submenus.length ,                        
                });
                if (item.Submenus.length > 0) {
                    this.parsePanel(containerId, id, level + 1, item.Submenus, pn, min);
                }
            });

            this.panels.push(panel);
        }
        private parseMenuData(containerId: string, md: menuNameless[]): void {
            this.parsePanel(containerId, containerId, 0, md, 0, 0);
        }
        private createMenuHtml(mid: string): string {
            var menuHtml = $(`<div id='${mid}' class='fastnet-menu ${this.direction}'></div>`);
            if (this.menuClasses !== null && this.menuClasses.length > 0) {
                $.each(this.menuClasses, (i, mc) => {
                    menuHtml.addClass(mc);
                });
            }
            $.each(this.panels, (i, panel) => {
                let panelHtml = $(`<div id='${panel.id}' class='menu-item-panel level-${panel.level}' data-parent='${panel.parentId}' ></div>`);
                panel.menuItems.sort((first, second) => {
                    if (first.index === second.index) {
                        return 0;
                    } else if (first.index < second.index) {
                        return -1;
                    } else {
                        return 1;
                    }
                });
                $.each(panel.menuItems, (j, mi) => {
                    var menuItemHtml = $(`<div id='${mi.id}' class='menu-item'></div>`);
                    if (mi.url === null) {
                        menuItemHtml.addClass("has-submenus");
                        menuItemHtml.append($(`<a href='#'><span>${mi.text}</span></a>`));
                        if (this.direction === "horizontal" && panel.level > 0) {
                            menuItemHtml.append($("<span class='fa fa-caret-right indicator'></span>"));
                        } else {
                            menuItemHtml.append($("<span class='fa fa-caret-down indicator'></span>"));
                        }
                    } else {
                        menuItemHtml.append($(`<a href='${mi.url}'><span>${mi.text}</span></a>`));
                    }
                    panelHtml.append(menuItemHtml);
                });
                menuHtml.append(panelHtml);
            });
            if (this.direction === "vertical") {
                $(menuHtml).find(".menu-item-panel:not(.level-0)").each((i, mp) => {
                    var parentId = $(mp).attr("data-parent");
                    $(menuHtml).find("#" + parentId).append(mp);
                });
            }
            $(menuHtml).find(".menu-item-panel").hide();
            return menuHtml[0].outerHTML;
        }
        private findPanelByParentId(parentId): panel {
            let result = null;
            $.each(this.panels, (i, panel) => {
                if (panel.parentId === parentId) {
                    result = panel;
                    return false;
                }
            });
            return result;
        }
        private showPanel(panel: panel, onComplete?: { (): void }) {
            let tagId = "#" + panel.id;
            if (panel.level === 0) {
                switch (this.direction) {
                    case "horizontal":
                        $(tagId).find(".menu-item").css("display", "inline-block");
                        break;
                    case "vertical":
                        $(tagId).find(".menu-item").css("display", "block");
                        break;
                }
            }

            if (this.direction === "horizontal" && panel.level > 0) {
                this.positionPanel(panel);
            }
            $(tagId).slideDown(() => {
                if ($.isFunction(onComplete)) {
                    onComplete();
                }
            });
            panel.visible = true;
            this.bindPanelMenuItems(panel);
        }
        private positionPanel(panel: panel) {
            let panelId = "#" + panel.id;
            $(panelId).css("position", "absolute");
            let parentMenuItemId = panel.parentId;
            let parent = this.findMenuItemById(parentMenuItemId);
            var top = null;
            var left = null;
            if (panel.level === 1) {
                top = parent.box.coords.top + parent.box.height;
                left = parent.box.coords.left;

            } else if (panel.level === 2) {
                top = parent.box.coords.top;
                left = parent.box.coords.left + parent.box.width;
            }
            $(panelId).css("left", left);
            $(panelId).css("top", top);
        }
        private findMenuItemById(id: string): menuItem {
            let rOuter: menuItem = null;
            $.each(this.panels, (i, panel) => {
                let rInner: menuItem = null;
                $.each(panel.menuItems, (j, mi) => {
                    if (mi.id === id) {
                        rInner = mi;
                        return false;
                    }
                })
                rOuter = rInner;
                if (rOuter !== null) {
                    return false;
                }
            });
            return rOuter;
        }
        private discoverStartingDimensions(): void {
            setTimeout(() => {
                this.menuBox = this.getBox("#" + this.menuId);
                var panel = this.findPanelByParentId(this.menuId);
                this.discoverDimensions(panel);
            }, 500);;
        }
        private getBox(tagId: string): box {
            var menuLocation = $("#" + this.menuId).offset();
            var location = $(tagId).offset();
            if (typeof location != "undefined") {
                return {
                    coords: { left: location.left - menuLocation.left, top: location.top - menuLocation.top },
                    container_offset: null,
                    mwidth: $(tagId).outerWidth(true),
                    mheight: $(tagId).outerHeight(true),
                    width: $(tagId).outerWidth(false),
                    height: $(tagId).outerHeight(false)
                };
            }
            else {
                return null;
            }
        }
        private discoverDimensions(panel: panel): void {
            var parentBox = null;
            if (panel.level === 0) {
                parentBox = this.menuBox;
            } else {
                var parentMenuItemId = panel.parentId;
                var parent = this.findMenuItemById(parentMenuItemId);
                parentBox = parent.box;
            }
            var panelId = "#" + panel.id;
            panel.box = this.getBox(panelId);
            //_setContainerOffset(parentBox, panel.box);
            $.each(panel.menuItems, (i, mi) => {
                var tagId = "#" + mi.id;
                mi.box = this.getBox(tagId);
                // _setContainerOffset(panel.box, mi.box);
            });
        }
        private bindPanelMenuItems(panel: panel): void {
            var menuId = "#" + this.menuId;
            var panelId = "#" + panel.id;
            $(menuId).find(panelId).find(".menu-item.has-submenus").on("click", (e) => {
                //var e_targetId = $(e.target).attr("id");
                var id = $(e.target).attr("id");// $(this).attr("id");
                //$U.Debug("click this.id {0}, e.target.id {1}", id, e_targetId);
                if ($(e.target)[0].tagName === "A" && $(e.target).attr("href") === "#") {
                    e.preventDefault();
                }
                e.stopPropagation();

                $("#" + id).siblings().each((i, sib) => {
                    var sibId = $(sib).attr("id");
                    var sib_subPanel = this.findPanelByParentId(sibId);
                    if (sib_subPanel !== null) {
                        this.hidePanel(sib_subPanel);
                    }
                });
                var subPanel = this.findPanelByParentId(id);

                if (subPanel.visible) {
                    this.hidePanel(subPanel);
                } else {
                    this.showPanel(subPanel);
                    this.discoverDimensions(subPanel);
                    this.setPositioningAttributes(subPanel);
                }
            })
        }
        private hidePanel(panel: panel) {
            if (panel.visible) {
                var tagId = "#" + panel.id;
                $.each(panel.menuItems, (i, mi) => {
                    var subPanel = this.findPanelByParentId(mi.id);
                    if (subPanel !== null) {
                        this.hidePanel(subPanel);
                    }
                });
                this.unbindPanelMenuItems(panel);
                panel.visible = false;
                $(tagId).slideUp();
            }
        }
        private setPositioningAttributes(panel): void {
            var panelId = "#" + panel.id;
            this.setAttributes(panelId, panel.box);
            $.each(panel.menuItems, (i, mi) => {
                var tagId = "#" + mi.id;
                this.setAttributes(tagId, mi.box);
            });
        }
        private setAttributes(tagId, box): void {
            $(tagId).attr("data-box", this.box2String(tagId, box));
        }
        private box2String(tagId, box: box): string {
            return `(${box.coords.left}, ${box.coords.top}) [${box.width}w ${box.height}h] [[${box.mwidth}w ${box.mheight}h]]`;
        }
        private unbindPanelMenuItems(panel: panel) {
            var menuId = "#" + this.menuId;
            var panelId = "#" + panel.id;
            $(menuId).find(panelId).find(".menu-item.has-submenus").off();
        }
        private closeOpenPanels() {
            $.each(this.panels, (i, panel) => {
                if (panel.level > 0) {
                    this.hidePanel(panel);
                }
            });
        }
    }
}