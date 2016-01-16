using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public enum bookingStatus
    {
        WaitingApproval,
        WaitingPayment,
        Confirmed,
        //AutoCancelled,
        Cancelled,
        WaitingGateway
    }
}
