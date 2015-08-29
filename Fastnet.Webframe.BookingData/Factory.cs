using Fastnet.Web.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    public class Factory : CustomFactory
    {
        public static DayInformation GetDayInformationInstance()
        {
            switch (FactoryName)
            {
                case FactoryName.None:
                    return new DayInformation();
                case FactoryName.DonWhillansHut:
                    return new DWHDayInformation();
                default:
                    throw new ApplicationException(string.Format("No DayInformation type is available for factory", FactoryName));
            }
        }
    }
}
