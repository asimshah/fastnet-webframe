using System;
using System.Collections.Generic;
using System.Linq;

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
                bodyText = string.Format(@"<div style='margin-bottom: 4px;'>No {0} email template defined</div>", template.ToString());
                bodyText += GetKeywordBody();
                subjectText = "{{reference}}: "  + string.Format("(subject line for {0})", template.ToString());
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
        private string GetKeywordBody()
        {
            string html =
            @"<div>Current key word values are:</div>
<table style='margin: 8px;'>
    <tr>
        <td>hutName</td>
        <td>{{hutName}}</td>
    </tr>
    <tr>
        <td>bookingSecretaryEmailAddress</td>
        <td>{{bookingSecretaryEmailAddress}}</td>
    </tr>
    <tr>
        <td>memberName</td>
        <td>{{memberName}}</td>
    </tr>
    <tr>
        <td>memberEmailAddress</td>
        <td>{{memberEmailAddress}}</td>
    </tr>
    <tr>
        <td>memberPhoneNumber</td>
        <td>{{memberPhoneNumber}}</td>
    </tr>
    <tr>
        <td>reference</td>
        <td>{{reference}}</td>
    </tr>
    <tr>
        <td>from</td>
        <td>{{from}}</td>
    </tr>
    <tr>
        <td>to</td>
        <td>{{to}}</td>
    </tr>
    <tr>
        <td>numberOfNights</td>
        <td>{{numberOfNights}}</td>
    </tr>
    <tr>
        <td>description</td>
        <td>{{description}}</td>
    </tr>
    <tr>
        <td>partySize</td>
        <td>{{partySize}}</td>
    </tr>
    <tr>
        <td>bookedOn</td>
        <td>{{bookedOn}}</td>
    </tr>
    <tr>
        <td>cost</td>
        <td>{{cost}}</td>
    </tr>
    <tr>
        <td>entryCode</td>
        <td>{{entryCode}}</td>
    </tr>
</table>";
            return html;
        }
    }
}
