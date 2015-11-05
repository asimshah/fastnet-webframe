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
        public async Task<List<Accomodation>> GetTotalAccomodation()
        {
            return await AccomodationSet.Where(x => x.ParentAccomodation == null).ToListAsync();
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
                subjectText = bodyText;
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
            t.BodyText = bodyText;
        }
        public void QueueEmail(Booking booking, BookingEmailTemplates template, DateTime dueAt, string emailAddress, string subject, string body)
        {
            var bem = new BookingEmail
            {
                Booking = booking,
                Template = template,
                DueAt = dueAt,
                EmailAddress = emailAddress,
                Subject = subject,
                Body = body,
                Status = BookingEmailStatus.NotSent
            };
            this.Emails.Add(bem);
        }
    }
}
