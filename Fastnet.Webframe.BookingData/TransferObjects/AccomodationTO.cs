using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    //public class AccomodationTO : Hierarchy<AccomodationTO>
    //{
    //    public long AccomodationId { get; set; }
    //    public AccomodationType Type { get; set; }
    //    public AccomodationClass Class { get; set; }
    //    public string Name { get; set; } // e.g 12 for room 12, "Ocean View" for the villa called Ocean View, etc
    //    public bool SubAccomodationSeparatelyBookable { get; set; }
    //    public bool Bookable { get; set; } // if false, then SubAccomodationSeparatelyBookable should be true, else it is means this accomodation has been taken out of service
    //    public AccomodationTO ParentAccomodation { get; set; }
    //    public List<AccomodationTO> SubAccomodation { get; set; }
    //    //public bool IsBookable { get; set; }
    //    public bool IsBooked { get; set; }
    //    public bool IsAvailableToBook { get; set; }
    //    public bool IsBlocked { get; set; } // i.e by an applicable blocking period
    //    public string BookingReference { get; set; }

    //    public override AccomodationTO GetParent()
    //    {
    //        return  ParentAccomodation;
    //    }
    //    public override IEnumerable<AccomodationTO> GetChildren()
    //    {
    //        return SubAccomodation;
    //    }
    //    public override string ToString()
    //    {
    //        return string.Format("{0} {1}, Bookable = {2}, Booked = {3}, Available = {4}", Name,
    //            ParentToString(), Bookable, IsBooked, IsAvailableToBook);//,GetSubAccomodationStatus());
    //        //return base.ToString();
    //    }
    //    private string ParentToString()
    //    {
    //        //return "unk";
    //        string fmt = ParentAccomodation == null ? "" : "(in {0})";
    //        return  string.Format(fmt, ParentAccomodation?.Name);
    //    }
    //}
}
