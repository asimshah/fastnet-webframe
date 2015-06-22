using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Common
{
    public static class MenuExtensions
    {
        public static string GetMenuHtml(this CoreDataContext ctx, Member currentMember)
        {
        //    // **TODO** redo this html generation so that
        //    // <ul> and <li> elements are easily identified
        //    // for the client side to manipulate, e.g. to add required bootstrap classes
        //    Func<Menu, TagBuilder> getLiTag = (menu) =>
        //    {
        //        TagBuilder tb = new TagBuilder("li");
        //        tb.Attributes.Add("id", menu.TagId);
        //        if (!string.IsNullOrWhiteSpace(menu.Url))
        //        {
        //            TagBuilder atag = new TagBuilder("a");
        //            atag.AddCssClass("menu-normal menu-hover");
        //            atag.Attributes.Add("href", menu.Url);
        //            atag.SetInnerText(menu.Text);
        //            tb.InnerHtml = atag.ToString();
        //        }
        //        else
        //        {
        //            TagBuilder spantag = new TagBuilder("span");
        //            spantag.Attributes.Add("style", "display:block;");
        //            spantag.SetInnerText(menu.Text);
        //            tb.InnerHtml = spantag.ToString();
        //        }
        //        return tb;
        //    };
        //    Func<Menu, List<Menu>> getAccessibleMenus = (m) =>
        //    {
        //        return m.SubMenus.ToArray().Where(x => x.Visible && (x.Page == null || x.Page.CanBeAccessedBy(currentMember))).OrderBy(y => y.Sequence).ToList();
        //    };
        //    Func<Menu, int, string> getMenuTags = null;
        //    getMenuTags = (m, depth) =>
        //    {
        //        string text = "";
        //        List<TagBuilder> tags = new List<TagBuilder>();
        //        foreach (Menu menu in getAccessibleMenus(m))
        //        {
        //            TagBuilder liTag = getLiTag(menu);
        //            string submenuText = getMenuTags(menu, depth + 1);
        //            if (!string.IsNullOrWhiteSpace(submenuText))
        //            {
        //                liTag.InnerHtml += submenuText;
        //            }
        //            tags.Add(liTag);
        //        }
        //        if (tags.Count > 0)
        //        {
        //            StringBuilder sb = new StringBuilder();
        //            foreach (TagBuilder tb in tags)
        //            {
        //                sb.Append(tb.ToString());
        //            }
        //            if (depth > 0)
        //            {
        //                text = string.Format("<ul>{0}</ul>", sb.ToString());
        //            }
        //            else
        //            {
        //                text = sb.ToString();
        //            }
        //        }
        //        return text;
        //    };
        //    //Menu defaultmenu = Menu.DefaultMenu;
        //    Menu defaultmenu = ctx.Menus.FirstOrDefault(x => x.ParentMenu == null);
        //    string menuTags = getMenuTags(defaultmenu, 0);
        //    if (menuTags.Length > 0)
        //    {
        //        TagBuilder ulTag = new TagBuilder("ul");
        //        //ulTag.AddCssClass("sf-menu");
        //        ulTag.InnerHtml = menuTags;
        //        return ulTag.ToString();
        //    }
        //    else
        //    {
        //        return "";
        //    }
            return "";
        }
    }
}