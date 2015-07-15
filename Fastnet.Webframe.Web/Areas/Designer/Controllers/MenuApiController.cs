using Fastnet.Common;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.WebApi;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace Fastnet.Webframe.Web.Areas.Designer.Controllers
{
    [RoutePrefix("designer/menuapi")]
    [PermissionFilter(SystemGroups.Administrators)]
    public class MenuApiController : BaseApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpGet]
        [Route("get/mms")]
        public async Task<HttpResponseMessage> GetMenuMasters()
        {
            Func<MenuMaster, string> findPage = (mm) =>
            {
                var p = DataContext.Pages.SingleOrDefault(x => x.PageMenu.Id == mm.Id);
                return p == null ? null : p.Url;
            };
            var mms = await DataContext.MenuMasters.OrderBy(x => x.Name).ToArrayAsync();
            var result = mms.Select(mm => new
            {
                Id = mm.Id,
                Name = mm.Name,
                ForMenuPanel = mm.PanelName == PanelNames.MenuPanel,
                PageUrl = findPage(mm),
                ClassName = mm.ClassName
            });
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("get/menus/{id}")]
        public async Task<HttpResponseMessage> GetMenus(long id)
        {
            Func<IEnumerable<Menu>, int, dynamic> getInfo = null;
            getInfo = (menus, level) =>
            {
                dynamic r = menus.OrderBy(x => x.Index).Select(x => new
                    {
                        Id = x.Id,
                        Index = x.Index,
                        Text = x.Text,
                        Url = x.Url,
                        Level = level,
                        NextLevel = level + 1,
                        SubMenus = getInfo(x.Submenus, level + 1)
                    });
                return r;
            };
            var mms = await DataContext.MenuMasters.FindAsync(id);
            object result = getInfo(mms.Menus, 0);
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpPost]
        [Route("create/newmaster")]
        public async Task<HttpResponseMessage> CreateNewMenuMaster()
        {
            var masters = await DataContext.MenuMasters.Select(x => x.Name).ToArrayAsync();
            var newName = "NewMenu".MakeUnique(masters);
            Menu menu = new Menu
            {
                Index = 0,
                Text = "Some text",                
            };
            MenuMaster newmm = new MenuMaster
            {
                ClassName = "default-menu",
                Name = newName,
                PanelName = PanelNames.None,
               
            };
            newmm.Menus.Add(menu);
            DataContext.MenuMasters.Add(newmm);
            await DataContext.SaveChangesAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}