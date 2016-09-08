using Fastnet.Web.Common;
using System;
using System.Linq;

namespace Fastnet.Webframe.BookingData
{
    public class BookingGlobals : CustomFactory
    {
        private readonly static string globalAbodeName;
        static BookingGlobals()
        {
            switch (FactoryName)
            {
                case FactoryName.DonWhillansHut:
                    using (var ctx = new BookingDataContext())
                    {
                        var abode = ctx.AccomodationSet.Single(x => x.ParentAccomodation == null);
                        globalAbodeName = abode.DisplayName;
                    }
                    break;
                default:
                    globalAbodeName = "(No global name)";
                    break;
            }
            
        }
        public static DateTime GetToday()
        {
            bool rollManually = Settings.bookingApp.rollDayManually;
            if (rollManually)
            {
                return new DateTime(2015, 9, 6);// DateTime.Today;// for now
            }
            else
            {
                return DateTime.Today;
            }
        }
        public static string GetAbodeName()
        {
            return globalAbodeName;
        }
        public static void Startup()
        {
            StandaloneBootstrap.Startup();
        }
    }
    public class StandaloneBootstrap
    {
        public static void Startup()
        {
            //var today = BookingGlobals.GetToday();
            //using (var ctx = new BookingDataContext())
            //{
            //    var cancelledBookings = ctx.Bookings.Where(b => b.Status == bookingStatus.Cancelled && b.To >= today && b.AccomodationCollection.Count() > 0);    
            //    foreach(var cb in cancelledBookings)
            //    {
            //        cb.AccomodationCollection.Clear();
            //    }
            //    ctx.SaveChanges();
            //}
        }
    }
}
