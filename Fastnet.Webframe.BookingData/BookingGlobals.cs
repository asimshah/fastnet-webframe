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
            //Mapper.CreateMap<Accomodation, AccomodationTO>()
            //    //.ForSourceMember(n => n.ParentAccomodation, opt => opt.Ignore())
            //    //.ForMember(n => n.IsBookable, opt => opt.Ignore())
            //    .ForMember(n => n.IsBooked, opt => opt.Ignore())
            //    .ForMember(n => n.IsAvailableToBook, opt => opt.Ignore())
            //    .ForMember(n => n.BookingReference, opt => opt.Ignore())
            //    .ForMember(n => n.IsBlocked, opt => opt.Ignore());
            //Mapper.AssertConfigurationIsValid();
            //Debugger.Break();
        }
    }
}
