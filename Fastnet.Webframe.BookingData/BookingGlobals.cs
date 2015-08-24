using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class BookingGlobals : CustomFactory
    {
        public static DateTime GetToday()
        {
            return DateTime.Today;// for now
        }
    }
}
