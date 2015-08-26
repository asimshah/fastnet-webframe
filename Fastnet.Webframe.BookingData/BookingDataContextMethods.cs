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

    public partial class BookingDataContext
    {
        /// <summary>
        /// Returns dtos for all accomodation that has not been blocked on the given day. This accomodation may or may not be booked.
        /// </summary>
        /// <param name="day"></param>
        /// <returns></returns>
        public async Task<IEnumerable<AccomodationTO>> GetAvailableAccomodation(DateTime day)
        {
            var rootItems = AccomodationSet.Where(x => x.ParentAccomodation == null);
            var allAccomodation = Mapper.Map<IEnumerable<Accomodation>, List<AccomodationTO>>(rootItems);
            Func<List<AccomodationTO>, Task> removeBlocked = null;
            removeBlocked = async (list) =>
            {
                foreach (var item in list.ToArray())
                {
                    Accomodation fullItem = await AccomodationSet.FindAsync(item.AccomodationId);
                    if (fullItem.IsBlocked(day))
                    {
                        list.Remove(item);
                    }
                    else
                    {
                        await removeBlocked(item.SubAccomodation);
                    }
                }
            };
            await removeBlocked(allAccomodation);
            return allAccomodation;
        }
        public async Task<DayInformation> GetDayInformation(DateTime day)
        {
            Func<IEnumerable<AccomodationTO>, Task<bool>> scanBookingStatus = null;
            scanBookingStatus = async (list) =>
            {
                foreach (var item in list)
                {
                    Accomodation fullItem = await AccomodationSet.FindAsync(item.AccomodationId);
                    if (!fullItem.Bookable)
                    {
                        item.IsAvailableToBook = false;
                    }
                    else
                    {
                        item.IsBookable = true;
                        item.IsAvailableToBook = true;
                        var bookingCount = fullItem.Bookings.Where(b => day >= b.From && day <= b.To).Count();
                        Debug.Assert(bookingCount < 2, string.Format("{0} is booked multiple times for {1}", fullItem.Name, day.ToString("ddMMMyyyy")));
                        bool isBooked = fullItem.Bookings.Where(b => day >= b.From && day <= b.To).Count() > 0;
                        if (isBooked)
                        {
                            item.IsAvailableToBook = false;
                            item.IsBooked = true;
                        }
                    }
                    if (!item.IsBooked)
                    {
                        var occ = await scanBookingStatus(item.SubAccomodation);
                        if(occ)
                        {
                            item.IsAvailableToBook = false;
                        }
                    }
                    else
                    {
                        foreach(var child in item.Descendants)
                        {
                            child.IsAvailableToBook = false;
                        }
                    }
                }
                bool occupied = false;
                if(list.Count() > 0)
                {
                    occupied = list.Any(x => x.Bookable == true && x.IsAvailableToBook == false)
                    || list.Any(x => x.Bookable == false && x.SubAccomodation.Any(z => z.IsAvailableToBook == false) == true);
                }
                //bool occupied = list.Count() > 0 && list.Any(x => x.Bookable == true && x.IsAvailableToBook == false);
                return occupied;
            };
            DayInformation di = new DayInformation();
            var availableAccomodation = await GetAvailableAccomodation(day);
            if (availableAccomodation.Count() == 0)
            {
                di.Status = DayStatus.IsBlocked;
            }
            else
            {
                await scanBookingStatus(availableAccomodation);
                int availableToBook = 0;
                int items = 0;
                foreach(var item in availableAccomodation)
                {
                    foreach(var si in item.SelfAndDescendants)
                    {
                        if (si.IsBookable)
                        {
                            items++;
                        }
                        availableToBook += si.IsAvailableToBook ? 1 : 0;
                    }
                }
                di.Status = availableToBook == 0 ? DayStatus.IsFull : items == availableToBook ? DayStatus.IsFree : DayStatus.IsPartBooked;
            }
            di.Accomodation = availableAccomodation;
            return di;
        }
    }
}
