using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class Globals
    {
        public static bool BookingIsOpen()
        {
            return true; 
        }
        public static string GetBookingSecretaryEmailAddress()
        {
            return Fastnet.Webframe.Web.Common.Globals.AdminEmailAddress;
        }
    }
}