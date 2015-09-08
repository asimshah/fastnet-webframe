using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Areas.booking.Common;
using Fastnet.Webframe.WebApi;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Dynamic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace Fastnet.Webframe.Web.Areas.booking.Controllers
{
    [RoutePrefix("bookingadmin")]
    //[PermissionFilter(SystemGroups.Administrators)]
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
        [HttpGet]
        [Route("get/occupancy/{fromYear}/{fromMonth}/{toYear}/{toMonth}")]
        public dayInformation[] GetOccupancy(int fromYear, int fromMonth, int toYear, int toMonth)
        {
            using (var ctx = new BookingDataContext())
            {
                DateTime start = new DateTime(fromYear, fromMonth, 1);
                DateTime end = new DateTime(toYear, toMonth, DateTime.DaysInMonth(toYear, toMonth));
                List<DayInformation> dayList = new List<DayInformation>();
                for (DateTime day = start; day <= end; day = day.AddDays(1))
                {
                    DayInformation di = Factory.GetDayInformationInstance(ctx, day);
                    dayList.Add(di);
                }
                return dayList.Select(x => x.ToClientType(true, true, DataContext)).ToArray();
            }
        }
    }
}
