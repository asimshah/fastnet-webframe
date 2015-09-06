using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.WebApi;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Fastnet.Webframe.Web.Areas.booking.Controllers
{
    [RoutePrefix("bookingadmin")]
    [PermissionFilter(SystemGroups.Administrators)]
    public class AdminController : BaseApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpGet]
        [Route("parameters")]
        public AdminParameters GetAdminParameters()
        {
            var groups = DataContext.Groups.Where(x => !x.Type.HasFlag(GroupTypes.System)).ToList();
            groups.Add(Group.AllMembers);
            groups.Add(Group.Administrators);
            var groupTuples = groups.OrderBy(x => x.Name).Select(x => new IGroup { Id =  x.GroupId, Name = x.Name });
            var adminParas = Factory.GetAdminParameters();
            adminParas.AvailableGroups = groupTuples.ToArray();
            if (adminParas is ICustomisable)
            {
                adminParas.Customise();
            }
            return adminParas;
        }
        [HttpPost]
        [Route("save/parameters")]
        public void SaveAdminParameters(dynamic data)
        {
            var adminParas = Factory.GetAdminParameters(data);
            adminParas.Save();
        }
    }
}
