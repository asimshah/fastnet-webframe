﻿using Fastnet.Webframe.BookingData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public abstract class BookingStateTransitionBase
    {
        protected BookingDataContext ctx;
        protected long abodeId;
        public BookingStateTransitionBase(BookingDataContext ctx, long abodeId)
        {
            this.ctx = ctx;
            this.abodeId = abodeId;
        }
        public abstract void ToNew(Booking booking);
        public abstract void ChangeState(Booking booking, bookingStatus from);
    }
}