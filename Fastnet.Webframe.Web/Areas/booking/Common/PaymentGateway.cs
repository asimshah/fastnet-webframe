using Fastnet.Web.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class PaymentGateway : CustomFactory
    {
        public bool Enabled { get; set; }
        public PaymentGateway()
        {
            Enabled = (bool)Settings.bookingApp.paymentGateway.enable;
        }
    }
}