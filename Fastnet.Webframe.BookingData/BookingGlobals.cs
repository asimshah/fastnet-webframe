using AutoMapper;
using Fastnet.Web.Common;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class BookingGlobals : CustomFactory
    {
        private readonly static string lodgmentName;
        static BookingGlobals()
        {
            lodgmentName = Settings?.bookingApp?.lodgmentName ?? "Lodgment";
        }
        public static DateTime GetToday()
        {
            return DateTime.Today;// for now
        }
        public static string GetLodgementName()
        {
            return lodgmentName;
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
            Mapper.CreateMap<Accomodation, AccomodationTO>()
                //.ForSourceMember(n => n.ParentAccomodation, opt => opt.Ignore())
                .ForMember(n => n.IsBookable, opt => opt.Ignore())
                .ForMember(n => n.IsBooked, opt => opt.Ignore())
                .ForMember(n => n.IsAvailableToBook, opt => opt.Ignore())
                .ForMember(n => n.BookingReference, opt => opt.Ignore());
            Mapper.AssertConfigurationIsValid();
            //Debugger.Break();
        }
    }
}
