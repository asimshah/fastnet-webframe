using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class abode
    {
        public long id { get; set; }
        public string name { get; set; }        
    }
    public class bookingParameters
    {
        public string factoryName { get; set; }
        public int maximumOccupants { get; set; }
        public abode currentAbode { get; set; }
        public List<abode> abodes { get; set; }
    }
}