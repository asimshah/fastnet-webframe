using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public static class EmailHelper
    {
        private static Dictionary<BookingEmailTemplates, Tuple<Func<object, string>, Func<object, string>>> templatecache
            = new Dictionary<BookingEmailTemplates, Tuple<Func<object, string>, Func<object, string>>>();
        internal static void QueueEmail(CoreDataContext dataContext, BookingDataContext ctx, long abodeId, Booking b)
        {
            BookingEmailTemplates template = BookingEmailTemplates.Provisional;
            DateTime dueAt = DateTime.Now;
            switch (b.Status)
            {
                case bookingStatus.Provisional:
                    template = BookingEmailTemplates.Provisional;
                    break;
            }
            string abodeName = ctx.AccomodationSet.Find(abodeId).DisplayName;
            var bookingSecretaryEmailAddress = Globals.GetBookingSecretaryEmailAddress();
            booking booking = Factory.GetBooking(dataContext, b);
            var bookingInfo = MapBookingInformation(abodeName, bookingSecretaryEmailAddress, booking);
            string subjectHtml;
            string bodyHtml;
            Render(ctx, template, bookingInfo, out subjectHtml, out bodyHtml);
            ctx.QueueEmail(b, template, dueAt, booking.memberEmailAddress, subjectHtml, bodyHtml);
        }
        public static void ClearEmailTemplateCache()
        {
            templatecache.Clear();
        }
        private static void Render(BookingDataContext ctx, BookingEmailTemplates template, dynamic data, out string subjectHtml, out string bodyHtml)
        {
            if (!templatecache.ContainsKey(template))
            {
                string subjectTemplate;
                string bodyTemplate;
                ctx.GetEmailTemplates(template, out subjectTemplate, out bodyTemplate);
                Func<object, string> st = HandlebarsDotNet.Handlebars.Compile(subjectTemplate);
                Func<object, string> bt = HandlebarsDotNet.Handlebars.Compile(bodyTemplate);
                templatecache.Add(template, Tuple.Create<Func<object, string>, Func<object, string>>(st, bt));
            }
            var tuple = templatecache[template];
            Func<object, string> subject = tuple.Item1;
            Func<object, string> body = tuple.Item2;
            subjectHtml = subject(data);
            bodyHtml = body(data);
        }

        private static dynamic MapBookingInformation(string abodeName, string bookingSecretaryEmailAddress, booking booking)
        {
            return new
            {
                hutName = abodeName,
                bookingSecretaryEmailAddress = bookingSecretaryEmailAddress,
                memberName = booking.memberName,
                reference = booking.reference,
                from = booking.from,
                to = booking.to,
                numberOfNights = booking.numberOfNights,
                description = booking.description,
                bookedOn = booking.createdOn,
                cost = booking.formattedCost,
                entryCode = booking.entryInformation
            };
        }
    }
}