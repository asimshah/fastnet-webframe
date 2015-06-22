using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Common
{
    public static class PageExtensions
    {
        //public static IEnumerable<Page> FindAllLandingPages(this CoreDataContext ctx, Member member = null)
        //{
        //    //List<Page> availableLandingPages = new List<Page>();
        //    IEnumerable<Page> availableLandingPages = ctx.Pages.Where(lp => lp.IsLandingPage).ToList();
        //    AccessRule viewAllowed = ctx.AccessRules.Single(ar => ar.Allow == true && ar.Permission == Permission.ViewPages);
        //    var pageAccessRulesForLandingPages = viewAllowed.PageAccessRules.Where(ex => ex.Page.IsLandingPage);
        //    var directoryAccessRulesForLandingPages = ctx.Directories.ToArray().SelectMany(d => d.GetEffectiveDirectoryAccessRules())
        //         .Join(availableLandingPages, a => a.Directory.DirectoryId, b => b.Directory.DirectoryId, (a, b) => new { a, b })
        //         .Select(z => z.a);
        //    IEnumerable<Group> groupsForThisMember = ctx.GetGroupsForMember(member);
        //    foreach (Group g in groupsForThisMember)
        //    {
        //        var y = pageAccessRulesForLandingPages.Where(a => a.Group == g).Select(b => b.Page);
        //        if (y.Count() > 0)
        //        {
        //            return y;
        //        }
        //        else
        //        {
        //            // otherwise look for landing pages with directory access rules
        //            y = directoryAccessRulesForLandingPages.Where(x => x.Group == g)
        //                .Join(availableLandingPages, a => a.Directory.DirectoryId, b => b.Directory.DirectoryId, (a, b) => new { a, b })
        //                .Select(z => z.b);
        //            if (y.Count() > 0)
        //            {
        //                return y;
        //            }
        //        }
        //    }
        //    return new List<Page>() { ctx.GetDefaultLandingPage() };
        //}
        //public static Page GetDefaultLandingPage(this CoreDataContext ctx)
        //{
        //    Group everyone = Group.Everyone;
        //    PageAccessRule par = ctx.PageAccessRules.Where(x => x.Group.GroupId == everyone.GroupId)
        //        .First(p => p.AccessRule.Allow == true && p.AccessRule.Permission == Permission.ViewPages);
        //    return par.Page;
        //}
        //public static Page GetDefaultBannerPage(this CoreDataContext ctx)
        //{
        //    Page home = ctx.GetDefaultLandingPage();
        //    PanelPage bannerpp = home.SidePanelPages.SingleOrDefault(pp => pp.Panel.PanelId == Panel.BannerPanel.PanelId);
        //    return bannerpp != null ? bannerpp.Page : null;
        //}
        //public static bool CanBeAccessedBy(this Page page, Member m)
        //{
        //    var groups = Core.GetDataContext().GetGroupsForMember(m);
        //    return groups.Any(g => IsAccessible(page, g));
        //}
        //private static bool IsAccessible(Page page, Group group)
        //{
        //    if (page.PageAccessRules.Count() > 0)
        //    {
        //        return page.PageAccessRules.Any(x =>
        //        {
        //            return x.Group == group || group.IsChildOf(x.Group);
        //        });
        //    }
        //    else
        //    {
        //        var rules = page.Directory.GetEffectiveDirectoryAccessRules();
        //        return rules.Any(x =>
        //        {
        //            return x.Group == group || group.IsChildOf(x.Group);
        //        });
        //    }
        //}
    }
}