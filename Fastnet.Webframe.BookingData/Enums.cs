using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public enum AccomodationType
    {
        Bed,
        Room,
        Suite, // i.e. a set of rooms
        Flat,
        Villa,
        Hut
    }
    public enum AccomodationClass
    {
        Standard,
        Superior,
        Executive,
        Deluxe
    }
    public enum OptionalExtras
    {
        Cot,
        SmallBed,
        LargeBed
    }
    public enum PeriodType
    {
        Fixed, // starts and finishes on specific dates
        Rolling, // continous rolling from today for an interval
        DaysInWeek // applies to specified days in the week
    }
    [Flags]
    public enum DaysOfTheWeek
    {
        Sunday = 1,
        Monday = 2,
        Tuesday = 4,
        Wednesday = 8,
        Thursday = 16,
        Friday = 32,
        Saturday = 64
    }

    //public enum AccomodationStatus
    //{
    //    AllFree,
    //    PartFree,
    //    Full,
    //    Blocked
    //}
}
