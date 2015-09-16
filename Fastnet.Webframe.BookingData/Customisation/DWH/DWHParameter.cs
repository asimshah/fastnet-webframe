﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class DWHParameter : Parameter
    {
        public string NoBMCCheckGroup { get; set; }
        public string BMCMembers { get; set; }
        public int ShortBookingInterval { get; set; }
    }
}
