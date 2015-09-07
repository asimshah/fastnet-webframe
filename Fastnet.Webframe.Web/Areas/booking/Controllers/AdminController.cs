using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
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
        [Route("get/occupancy")]
        // public async Task<dynamic> GetOccupancyPaged(int fromYear, int fromMonth, int toYear, int toMonth)
        public async Task<dynamic> GetOccupancyPaged()
        {
            //Func<IEnumerable<AccomodationTO>, dynamic> getDetails = null;
            //getDetails = (accomodation) =>
            //{
            //    List<ExpandoObject> details = new List<ExpandoObject>();
            //    foreach (var item in accomodation)
            //    {
            //        dynamic d = new ExpandoObject();
            //        d.bookable = item.Bookable; // false if this accomodation is configured not to be bookable, see comment in entity declaration for Accomodation
            //        d.@class = item.Class;
            //        d.isAvailableToBook = item.IsAvailableToBook; // false if not Bookable, or Booked, or subaccomodation is occupied
            //        //d.isBookable = item.IsBookable;
            //        d.isBooked = item.IsBooked; // true == this item is itself booked
            //        d.isBlocked = item.IsBlocked; // true if blocked by a blocking period
            //        d.bookingReference = item.BookingReference;
            //        d.name = item.Name;
            //        d.type = item.Type;
            //        d.canBookSubAccomodation = item.SubAccomodationSeparatelyBookable;
            //        d.details = getDetails(item.SubAccomodation);
            //        details.Add(d);
            //    }
            //    return details;
            //};
            Func<IEnumerable<AccomodationTO>, dynamic> getDetails2 = null;
            getDetails2 = (accomodation) =>
            {
                List<ExpandoObject> details = new List<ExpandoObject>();
                foreach (var item in accomodation)
                {
                    dynamic d = new ExpandoObject();
                    d.bookable = item.Bookable; // false if this accomodation is configured not to be bookable, see comment in entity declaration for Accomodation
                    d.@class = item.Class;
                    d.isAvailableToBook = item.IsAvailableToBook; // false if not Bookable, or Booked, or subaccomodation is occupied
                    //d.isBookable = item.IsBookable;
                    d.isBooked = item.IsBooked; // true == this item is itself booked
                    d.isBlocked = item.IsBlocked; // true if blocked by a blocking period
                    d.bookingReference = item.BookingReference;
                    d.name = item.Name;
                    d.type = item.Type;
                    d.canBookSubAccomodation = item.SubAccomodationSeparatelyBookable;
                    //d.details = getDetails(item.SubAccomodation);
                    details.Add(d);
                }
                return details;
            };
            //var query = HttpUtility.ParseQueryString(this.Request.RequestUri.Query);
            //int draw = Convert.ToInt32(query["draw"]);
            //int start = Convert.ToInt32(query["start"]);
            //int length = Convert.ToInt32(query["length"]);

            using (var ctx = new BookingDataContext())
            {
                var cal = ctx.GetCalendarSetupInfo();
                //DateTime endDate = cal.Until;
                DateTime today = BookingGlobals.GetToday();
                DateTime until = cal.Until;// today.AddMonths(6);
                double numberOfdays = (until - today).TotalDays + 1;
                var list = await ctx.GetDayStatusForDateRange(today, until, false);
                List<ExpandoObject> result = new List<ExpandoObject>();
                //foreach (var day in list)
                //{
                //    dynamic d = new ExpandoObject();
                //    d.day = day.Day.ToString("ddMMMyyyy");
                //    d.status = day.Status.ToString();
                //    d.accomodationCount = day.Accomodation.Count();
                //    d.accomodationDetails = getDetails(day.Accomodation);
                //    result.Add(d);
                //}
                foreach (var day in list)
                {
                    foreach (var x in day.Accomodation)
                    {
                        dynamic d = new ExpandoObject();
                        d.day = day.Day.ToString("ddMMMyyyy");
                        d.status = day.Status.ToString();
                        //d.accomodationCount = day.Accomodation.Count();
                        if (day.Status != DayStatus.IsFree)
                        {
                            d.accomodationDetails = getDetails2(x.SelfAndDescendants);
                        }
                        result.Add(d);
                    }
                }
                Debug.Print("Occupancy period {0} days, result row count {1}", numberOfdays, result.Count());
                return result;
            }
        }
    }
}
