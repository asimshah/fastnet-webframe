using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Routing;

namespace Fastnet.Webframe.SagePay
{
    public class TransactionRegistrar
    {
        private readonly Config configuration;
        private readonly HttpRequestSender requestSender;
        public TransactionRegistrar(Config config)
        {
            this.configuration = config;
            requestSender = new HttpRequestSender();
        }
        public object Send(RequestContext context, string vendorTxCode, ShoppingBasket basket,
                        Address billingAddress, Address deliveryAddress, string customerEmail, PaymentFormProfile paymentFormProfile = PaymentFormProfile.Normal, string currencyCode = "GBP",
                        MerchantAccountType accountType = MerchantAccountType.Ecommerce, TxType txType = TxType.Payment)
        {
            string sagePayUrl = configuration.RegistrationUrl;
            string notificationUrl = configuration.BuildNotificationUrl(context);// urlResolver.BuildNotificationUrl(context);

            var registration = new TransactionRegistration(
                vendorTxCode, basket, notificationUrl,
                billingAddress, deliveryAddress, customerEmail,
                configuration.VendorName,
                currencyCode, paymentFormProfile, accountType, txType);

            var serializer = new HttpPostSerializer();
            var postData = serializer.Serialize(registration);

            var response = requestSender.SendRequest(sagePayUrl, postData);

            var deserializer = new ResponseSerializer();
            return deserializer.Deserialize<TransactionRegistrationResponse>(response);
        }
    }
}
