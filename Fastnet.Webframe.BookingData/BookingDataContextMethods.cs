using AutoMapper;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    //public static class _mapper
    //{
    //    private static AccomodationTO mapItem(Accomodation source)
    //    {
    //        var item = new AccomodationTO
    //        {
    //            AccomodationId = source.AccomodationId,
    //            Type = source.Type,
    //            Class = source.Class,
    //            Name = source.Name,
    //            SubAccomodationSeparatelyBookable = source.SubAccomodationSeparatelyBookable,
    //            Bookable = source.Bookable,
    //            SubAccomodation = map(source.SubAccomodation)
    //        };
    //        return item;
    //    }
    //    public static List<AccomodationTO> map(IEnumerable<Accomodation> source)
    //    {
    //        var list = new List<AccomodationTO>();
    //        foreach (var item in source)
    //        {
    //            list.Add(mapItem(item));
    //        }
    //        return list;
    //    }
    //}
    public partial class BookingDataContext
    {
        public async Task<List<Accomodation>> GetTotalAccomodation()
        {
            return await AccomodationSet.Where(x => x.ParentAccomodation == null).ToListAsync();
            //var rootItems = await AccomodationSet.Where(x => x.ParentAccomodation == null).ToArrayAsync();
            //return Mapper.Map<IEnumerable<Accomodation>, List<AccomodationTO>>(rootItems);
        }
        //public async Task<IEnumerable<Accomodation>> GetAvailableAccomodation(DateTime day)
        //{
        //    //var allAccomodation = await GetTotalAccomodation();
        //    var allAccomodation = await AccomodationSet.Where(x => x.ParentAccomodation == null).ToListAsync();
        //    Func<List<Accomodation>, Task> markBlocked = null;
        //    markBlocked = async (list) =>
        //    {
        //        //foreach (var item in list.ToArray())
        //        foreach (var fullItem in list.ToArray())
        //        {
        //            //Accomodation fullItem = await AccomodationSet.FindAsync(item.AccomodationId);
        //            fullItem.extension = new Ex();
        //            if (fullItem.IsBlocked(day))
        //            {
        //                //IsBlocked() returns true if a blocking period exists for this day
        //                // for this accomodation item
        //                //item.IsBlocked = true;
        //                fullItem.extension.IsBlocked = true;
        //            }
        //            else
        //            {
        //                //await markBlocked(item.SubAccomodation);
        //                await markBlocked(fullItem.SubAccomodation.ToList());
        //            }
        //        }
        //    };
        //    await markBlocked(allAccomodation);
        //    return allAccomodation;
        //}
        //public async Task<DayInformation> GetDayInformation(DateTime day, bool includeBlocked = false)
        //{
        //    Func<IEnumerable<Accomodation>, Task<bool>> scanBookingStatus = null;
        //    #region scanBookingStatus
        //    scanBookingStatus = async (list) =>
        //    {
        //        foreach (var fullItem in list)
        //        {
        //            //fullItem.extension = new Ex();
        //            if(fullItem.GetIsBlockedState(day))
        //            {
        //                fullItem.IsBlocked = true;
        //            }
        //            if (!fullItem.Bookable)
        //            {
        //                fullItem.IsAvailableToBook = false;
        //            }
        //            else
        //            {
        //                fullItem.IsAvailableToBook = true;
        //                var bookings = fullItem.Bookings.Where(b => day >= b.From && day <= b.To);
        //                var bookingCount = bookings.Count();// fullItem.Bookings.Where(b => day >= b.From && day <= b.To).Count();
        //                Debug.Assert(bookingCount < 2, string.Format("{0} is booked multiple times for {1}", fullItem.Name, day.ToString("ddMMMyyyy")));
        //                bool isBooked = bookingCount > 0;
        //                if (isBooked)
        //                {
        //                    Booking booking = bookings.First();
        //                    fullItem.BookingReference = booking.Reference;
        //                    fullItem.IsAvailableToBook = false;
        //                    fullItem.IsBooked = true;
        //                }
        //            }
        //            if (!fullItem.IsBooked)
        //            {
        //                var occ = await scanBookingStatus(fullItem.SubAccomodation);
        //                if (occ)
        //                {
        //                    fullItem.IsAvailableToBook = false;
        //                }
        //            }
        //            else
        //            {
        //                foreach (var child in fullItem.Descendants)
        //                {
        //                    child.IsAvailableToBook = false;
        //                }
        //            }
        //        }
        //        bool occupied = false;
        //        if (list.Count() > 0)
        //        {
        //            occupied = list.Any(x => x.Bookable == true && x.IsAvailableToBook == false)
        //            || list.Any(x => x.Bookable == false && x.SubAccomodation.Any(z => z.IsAvailableToBook == false) == true);
        //        }
        //        return occupied;
        //    };

        //    #endregion            //
        //    DayInformation di = Factory.GetDayInformationInstance();// new DayInformation();
        //    di.Day = day;
        //    var availableAccomodation = await AccomodationSet.Where(x => x.ParentAccomodation == null).ToListAsync();// await GetAvailableAccomodation(day);
        //    if (availableAccomodation.Count(x => x.GetIsBlockedState(day) == false) == 0)
        //    {
        //        //availableAccomodation includes everything except those
        //        //accomodations items that have been blocked as a result
        //        //of a blocking period that applies to this day
        //        //if the count == 0, then there is nothing available at all
        //        //due to the blocking period
        //        di.Status = DayStatus.IsClosed;
        //    }
        //    else
        //    {
        //        await scanBookingStatus(availableAccomodation);
        //        int availableToBook = 0;
        //        int items = 0;
        //        foreach (var item in availableAccomodation)
        //        {
        //            foreach (var si in item.SelfAndDescendants)
        //            {
        //                if (si.Bookable)
        //                {
        //                    items++;
        //                }
        //                availableToBook += si.IsAvailableToBook ? 1 : 0;
        //            }
        //        }
        //        di.Status = availableToBook == 0 ? DayStatus.IsFull : items == availableToBook ? DayStatus.IsFree : DayStatus.IsPartBooked;

        //    }
        //    di.Accomodation = availableAccomodation;
        //    di.PostProcess(this, day);
        //    return di;
        //}
        public CalendarSetupTO GetCalendarSetupInfo()
        {
            ParameterBase p = Parameters.Single();
            Period fp = p.ForwardBookingPeriod;
            DateTime start = BookingGlobals.GetToday();
            DateTime end;
            switch (fp.PeriodType)
            {
                case PeriodType.Fixed:
                    if (!fp.EndDate.HasValue)
                    {
                        var xe = new ApplicationException("Fixed Forward booking period must have an end date");
                        //Log.Write(xe);
                        throw xe;
                    }
                    start = new[] { fp.StartDate.Value, start }.Max();
                    end = fp.EndDate.Value;
                    break;
                case PeriodType.Rolling:
                    end = fp.GetRollingEndDate(start);
                    break;
                default:
                    var xe2 = new ApplicationException("No valid Forward booking period available");
                    //Log.Write(xe2);
                    throw xe2;
            }
            return new CalendarSetupTO { StartAt = start, Until = end };
        }
        //public async Task<List<DayInformation>> GetDayStatusForDateRange(DateTime start, DateTime end, bool reducePayload = true)
        //{
        //    List<DayInformation> dayList = new List<DayInformation>();
        //    for (DateTime day = start; day <= end; day = day.AddDays(1))
        //    {
        //        DayInformation di = await GetDayInformation(day);
        //        switch (di.Status)
        //        {
        //            case DayStatus.IsClosed:
        //            case DayStatus.IsFull:
        //            case DayStatus.IsPartBooked:
        //            case DayStatus.IsNotBookable:
        //            case DayStatus.IsFree:
        //                di.StatusDisplay = di.ToString();
        //                if (reducePayload)
        //                {
        //                    di.Accomodation = null;// N.B (a) di.Accomodation needed for di.ToString(), (b) nulled to reduce payload    
        //                }
        //                dayList.Add(di);
        //                break;
        //        }
        //    }
        //    return dayList;
        //}
    }
}
