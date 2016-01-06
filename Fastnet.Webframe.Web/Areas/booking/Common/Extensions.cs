using Fastnet.Webframe.BookingData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public static class Extensions
    {
        public static void PerformStateTransition(this Booking booking, BookingDataContext ctx, bookingStatus previous, long abodeId = 1)
        {
            var bst = Factory.GetBookingStateTransition(ctx, abodeId);
            if (booking.Status != previous)
            {
                booking.StatusLastChanged = DateTime.Now;
                bst.ChangeState(booking, previous);
            }
        }
    }
}