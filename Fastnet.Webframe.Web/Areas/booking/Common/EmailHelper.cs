using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Common;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public static class EmailHelper
    {
        private static Dictionary<BookingEmailTemplates, Tuple<Func<object, string>, Func<object, string>>> templatecache
            = new Dictionary<BookingEmailTemplates, Tuple<Func<object, string>, Func<object, string>>>();
        internal static void QueueEmail(BookingDataContext ctx, string abodeName, string bookingSecretaryEmailAddress, DateTime utcDueAt, BookingEmailTemplates template, string destinationAddress, booking b)
        {
            
            var bookingInfo = MapBookingInformation(abodeName, bookingSecretaryEmailAddress, b);
            string subjectHtml;
            string bodyHtml;
            Render(ctx, template, bookingInfo, out subjectHtml, out bodyHtml);
            QueueEmail(ctx, b, template, utcDueAt, destinationAddress, subjectHtml, bodyHtml);
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
                memberEmailAddress = booking.memberEmailAddress,
                memberPhoneNumber = booking.memberPhoneNumber,
                reference = booking.reference,
                from = booking.from,
                to = DateTime.Parse(booking.to).AddDays(1).ToDefault(),
                numberOfNights = booking.numberOfNights,
                description = booking.description,
                bookedOn = booking.createdOn,
                cost = booking.formattedCost,
                partySize = booking.partySize,
                entryCode = booking.entryInformation
            };
        }
        private static void QueueEmail(BookingDataContext ctx,  booking b, BookingEmailTemplates template, DateTime utcDueAt, string emailAddress, string subject, string body)
        {
            var booking = ctx.Bookings.Single(x => x.BookingId == b.bookingId);
            var bem = new BookingEmail
            {
                Booking = booking,
                Template = template,
                UtcDueAt = utcDueAt,
                EmailAddress = emailAddress,
                Subject = subject,
                Body = body,
                Status = BookingEmailStatus.NotSent
            };
            ctx.Emails.Add(bem);
        }
    }
}