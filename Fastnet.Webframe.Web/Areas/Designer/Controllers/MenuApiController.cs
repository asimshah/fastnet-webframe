using Fastnet.Common;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.WebApi;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using Fastnet.EventSystem;
using System.Web.Hosting;
using System.IO;

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
            var mms = await DataContext.MenuMasters.OrderBy(x => x.Name).ToArrayAsync();
            var result = mms.Select(mm => new
            {
                Id = mm.Id,
                Name = mm.Name,
                ForMenuPanel = mm.PanelName == PanelNames.MenuPanel,
                PageUrl = mm.Page != null ? mm.Page.Url : null,// findPage(mm),
                ClassName = mm.ClassName,
                Description = mm.GetDescriptor()// getDescriptor(mm)
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
                        IsFirst = x.Index == 0 ? "is-first" : "",
                        IsLast = x.Index == (menus.Count() - 1) ? "is-last" : "",
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
                Text = "new choice",
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
        [HttpPost]
        [Route("delete")]
        public async Task<HttpResponseMessage> Delete(dynamic data)
        {
            Action<IEnumerable<Menu>> deleteList = null;
            deleteList = (l) =>
            {
                foreach (Menu m in l.ToArray())
                {                    
                    deleteList(m.Submenus);
                    DataContext.Menus.Remove(m);
                }
            };
            string option = data.option;
            if (option == "master")
            {
                long masterId = data.masterId;
                MenuMaster mm = await DataContext.MenuMasters.FindAsync(masterId);
                deleteList(mm.Menus);
                DataContext.MenuMasters.Remove(mm);
            }
            else
            {
                long menuId = data.menuId;
                Menu menu = await DataContext.Menus.FindAsync(menuId);
                deleteList(menu.Submenus);
                if (menu.ParentMenu != null)
                {
                    menu.ParentMenu.Submenus.Remove(menu);
                }
                else
                {
                    MenuMaster mm = await DataContext.MenuMasters.SingleAsync(z => z.Menus.Any(x => x.Id == menu.Id));
                    mm.Menus.Remove(menu);
                }

            }
            await DataContext.SaveChangesAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpPost]
        [Route("move/choice")]
        public async Task<HttpResponseMessage> MoveChoice(dynamic data)
        {
            long menuId = data.menuId;
            int offset = data.offset;
            Menu menu = await DataContext.Menus.FindAsync(menuId);
            IOrderedEnumerable<Menu> list = null;
            if (menu.ParentMenu != null)
            {
                list = menu.ParentMenu.Submenus.OrderBy(m => m.Index);
            }
            else
            {
                MenuMaster mm = await DataContext.MenuMasters.SingleAsync(z => z.Menus.Any(x => x.Id == menu.Id));
                list = mm.Menus.OrderBy(m => m.Index);
            }
            int currentIndex = menu.Index;
            int requiredIndex = currentIndex + offset;
            Menu temp = list.ElementAt(requiredIndex);
            temp.Index = currentIndex;
            menu.Index = requiredIndex;
            await DataContext.SaveChangesAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpPost]
        [Route("add/choice")]
        public async Task<HttpResponseMessage> AddChoice(dynamic data)
        {
            string option = data.option;
            Menu newMenu = new Menu
            {
                Text = "new choice"
            };
            if (option == "toplevel")
            {
                long masterId = data.masterId;
                MenuMaster mm = await DataContext.MenuMasters.FindAsync(masterId);
                newMenu.Index = mm.Menus.Count();
                mm.Menus.Add(newMenu);
            }
            else
            {
                long menuId = data.menuId;
                Menu menu = await DataContext.Menus.FindAsync(menuId);
                newMenu.Index = menu.Submenus.Count();
                menu.Submenus.Add(newMenu);
            }
            await DataContext.SaveChangesAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpPost]
        [Route("update/menus")]
        public async Task<HttpResponseMessage> UpdateMenus(dynamic data)
        {
            try
            {
                Action<dynamic[]> updateMenuList = null;
                updateMenuList = (list) =>
                {
                    foreach (dynamic m in list)
                    {
                        long menuId = m.id;
                        Menu menu = DataContext.Menus.Find(menuId);
                        menu.Index = m.index;
                        menu.Text = m.text;
                        menu.Url = m.url;
                        if (menu.Url == null)
                        {
                            var menus = ((JArray)m.menus).ToObject<dynamic[]>();
                            updateMenuList(menus);
                        }
                    }
                };
                long masterId = data.id;
                MenuMaster mm = await DataContext.MenuMasters.FindAsync(masterId);
                mm.Name = data.name;
                mm.ClassName = data.classNames;
                bool forMenuPanel = data.forMenuPanel;
                string pageUrl = data.pageUrl;
                if (forMenuPanel)
                {
                    mm.PanelName = PanelNames.MenuPanel;
                    pageUrl = null;
                }
                else
                {
                    mm.PanelName = PanelNames.None;

                }
                if (string.IsNullOrWhiteSpace(pageUrl))
                {
                    mm.Page = null;
                }
                else
                {
                    long pageId = Convert.ToInt64(pageUrl.Substring("page/".Length));
                    var page = await DataContext.Pages.FindAsync(pageId);
                    mm.Page = page;
                }
                updateMenuList(((JArray)data.menus).ToObject<dynamic[]>());
                //
                await DataContext.SaveChangesAsync();
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Descriptor = mm.GetDescriptor() });

            }
            catch (Exception xe)
            {
                Log.Write(xe);
                //Debugger.Break();
                throw;
            }
        }
        [HttpGet]
        [Route("get/pagetype/{id}")]
        public async Task<HttpResponseMessage> GetPageType(long id)
        {
            Page p = await DataContext.Pages.FindAsync(id);
            return this.Request.CreateResponse(HttpStatusCode.OK, new { PageType = (int)p.Type, PageTypeName = p.Type.ToString().ToLower()});
        }
        [HttpGet]
        [Route("get/styles")]
        public async Task<HttpResponseMessage> GetMenuStyles()
        {
            var defaultCSS = GetMenuDefaultCSS();
            var customLess = GetCustomMenuLess();
            //object nullObject = null;
            var result = new { DefaultCSS = defaultCSS, CustomLess = customLess };
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, result));
        }
        [HttpPost]
        [Route("save/styles")]
        public async Task<HttpResponseMessage> SaveMenuStyles(dynamic data)
        {
            string lessText = data.LessText;
            string cssText = data.CSSText;
            string lessFolder = HostingEnvironment.MapPath("~/Content/Main/CustomLess");
            string cssFolder = HostingEnvironment.MapPath("~/Content/Main/DefaultCSS");
            string lessFile = Path.Combine(lessFolder, "menu.less");
            File.WriteAllText(lessFile, lessText);
            string cssFile = Path.Combine(cssFolder, "menu.user.css");
            File.WriteAllText(cssFile, cssText);
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
        }
        private string GetMenuDefaultCSS()
        {
            var folder = HostingEnvironment.MapPath("~/Content/fastnet");
            var filename = Path.Combine(folder, "menu.css");
            return File.ReadAllText(filename);
        }
        private string GetCustomMenuLess()
        {
            string folder = HostingEnvironment.MapPath("~/Content/Main/CustomLess");
            if (!System.IO.Directory.Exists(folder))
            {
                System.IO.Directory.CreateDirectory(folder);
            }
            var filename = Path.Combine(folder, "menu.less");
            if (File.Exists(filename))
            {
                return File.ReadAllText(filename);
            }
            else
            {
                return string.Empty;
            }
        }
    }
}