using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Mvc;
using Fastnet.Webframe.SagePay;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Areas.booking.Controllers
{
    [RouteArea("booking")]
    [VerifySession]
    //[PermissionFilter(SystemGroups.Administrators, "Booking features are not available")]
    public class HomeController : BaseMvcController
    {
        //private CoreDataContext DataContext;
        // GET: booking/Home
        [Route("home")]
        [Route("")]
        public ActionResult Index()
        {
            return View();
        }
        [Authorize]
        [Route("my")]
        public ActionResult MyBooking()
        {
            CoreDataContext DataContext = Core.GetDataContext();
            bookingParameters pars = Factory.GetBookingParameters();
            pars.Load(DataContext);
            ViewBag.PaymentGatewayAvailable = pars.paymentGatewayAvailable;
            return View();
        }
        [Route("sage/notify")]
        public ActionResult Notify(SagePayResponse response)
        {
            // SagePay should have sent back the order ID
            if (string.IsNullOrEmpty(response.VendorTxCode))
            {
                return new ErrorResult();
            }
            CoreDataContext DataContext = Core.GetDataContext();
            var st = DataContext.SageTransactions.Find(response.VendorTxCode);
            if (st == null)
            {
                return new TransactionNotFoundResult(response.VendorTxCode);
            }
            //// Get the order out of our "database"
            //var order =  _orderRepository.GetById(response.VendorTxCode);

            //// IF there was no matching order, send a TransactionNotfound error
            //if (order == null)
            //{
            //    return new TransactionNotFoundResult(response.VendorTxCode);
            //}

            // Check if the signature is valid.
            // Note that we need to look up the vendor name from our configuration.
            if (!response.IsSignatureValid(st.SecurityKey, Configuration.Current.VendorName))
            {
                return new InvalidSignatureResult(response.VendorTxCode);
            }

            // All good - tell SagePay it's safe to charge the customer.
            return new ValidOrderResult(st.VendorTxCode, response);
        }
        [Route("sage/failed/{vendorTxCode}")]
        public ActionResult Failed(string vendorTxCode)
        {
            CoreDataContext DataContext = Core.GetDataContext();
            var st = DataContext.SageTransactions.Find(vendorTxCode);
            if (st == null)
            {
                // what should we do here? Can it happen?
                return new TransactionNotFoundResult(vendorTxCode);
            }
            var memberId = st.GuidUserKey;
            var member = DataContext.Members.Find(memberId);
            var bookingId = st.LongUserKey;
            PaymentFailedModel m = new PaymentFailedModel();
            m.MemberEmailAddress = member.EmailAddress;
            m.BookingSecretaryEmailAddress = Globals.GetBookingSecretaryEmailAddress();
            m.UiSource = st.UserString;
            using (var ctx = new BookingDataContext())
            {
                var booking = ctx.Bookings.Find(bookingId);
                var paymentDuringNewBooking = "onlinebooking" == st.UserString;
                booking.PerformStateTransition("System", ctx, booking.Status, paymentDuringNewBooking ? bookingStatus.Cancelled : bookingStatus.WaitingPayment, false);
                ctx.SaveChanges();
            }
                return View(m);
        }
        [Route("sage/success/{vendorTxCode}")]
        public ActionResult Success(string vendorTxCode)
        {
            CoreDataContext DataContext = Core.GetDataContext();
            var st = DataContext.SageTransactions.Find(vendorTxCode);
            if (st == null)
            {
                // what should we do here? Can it happen?
                return new TransactionNotFoundResult(vendorTxCode);
            }
            var memberId = st.GuidUserKey;
            var member = DataContext.Members.Find(memberId);
            var bookingId = st.LongUserKey;
            PaymentSuccessModel psm = new PaymentSuccessModel();
            psm.MemberEmailAddress = member.EmailAddress;
            psm.BookingSecretaryEmailAddress = Globals.GetBookingSecretaryEmailAddress();
            using (var ctx = new BookingDataContext())
            {
                var booking = ctx.Bookings.Find(bookingId);
                booking.SetPaid(ctx, member.Fullname, true);
                booking.PerformStateTransition("System", ctx, booking.Status, bookingStatus.Confirmed, false);
                psm.BookingReference = booking.Reference;
                ctx.SaveChanges();
            }
            return View(psm);
        }
        //[Route("sage/success/{vendorTxCode}")]
        //public ActionResult RegistrationFailed(string vendorTxCode)
        //{
        //    return View();
        //}
    }
}