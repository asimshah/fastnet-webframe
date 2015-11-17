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
        public List<Accomodation> GetTotalAccomodation()
        {
            return AccomodationSet.Where(x => x.ParentAccomodation == null).ToList();
            //var rootItems = await AccomodationSet.Where(x => x.ParentAccomodation == null).ToArrayAsync();
            //return Mapper.Map<IEnumerable<Accomodation>, List<AccomodationTO>>(rootItems);
        }
        public calendarSetup GetCalendarSetupInfo()
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
            return new calendarSetup { Today = BookingGlobals.GetToday(), StartAt = start, Until = end };
        }
        public void GetEmailTemplates(BookingEmailTemplates template, out string subjectText, out string bodyText)
        {
            var t = this.EmailTemplates.SingleOrDefault(x => x.Template == template);
            if (t == null)
            {
                bodyText = string.Format(@"<div>No {0} email template defined<div>", template.ToString());
                subjectText = "";
            }
            else
            {
                subjectText = t.SubjectText;
                bodyText = t.BodyText;
            }
        }
        public void SaveEmailTemplate(BookingEmailTemplates template, string subjextText, string bodyText)
        {
            var t = this.EmailTemplates.SingleOrDefault(x => x.Template == template);
            if(t == null)
            {
                t = new EmailTemplate { Template = template };
                this.EmailTemplates.Add(t);
            }
            t.SubjectText = subjextText;
            t.BodyText = bodyText;
        }
    }
}
