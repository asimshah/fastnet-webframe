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

            // Get the order out of our "database"
            var order =  _orderRepository.GetById(response.VendorTxCode);

            // IF there was no matching order, send a TransactionNotfound error
            if (order == null)
            {
                return new TransactionNotFoundResult(response.VendorTxCode);
            }

            // Check if the signature is valid.
            // Note that we need to look up the vendor name from our configuration.
            if (!response.IsSignatureValid(order.SecurityKey, Configuration.Current.VendorName))
            {
                return new InvalidSignatureResult(response.VendorTxCode);
            }

            // All good - tell SagePay it's safe to charge the customer.
            return new ValidOrderResult(order.VendorTxCode, response);
        }
        [Route("sage/failed/{vendorTxCode}")]
        public ActionResult Failed(string vendorTxCode)
        {
            return View();
        }
        [Route("sage/success/{vendorTxCode}")]
        public ActionResult Success(string vendorTxCode)
        {
            return View();
        }
    }
}