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
        
        private readonly Configuration configuration;
        private readonly HttpRequestSender requestSender;
        private readonly DefaultUrlResolver urlResolver;
        public TransactionRegistrar(Uri requestUri)
        {
            this.configuration = Configuration.Current;
            this.configuration.SetNotificationHost(requestUri.Host, requestUri.Port);
            requestSender = new HttpRequestSender();
            urlResolver = new DefaultUrlResolver();
        }
        public TransactionRegistrationResponse Send(string vendorTxCode, string description, decimal amount,
                Address billingAddress, Address deliveryAddress, string customerEmail, PaymentFormProfile paymentFormProfile = PaymentFormProfile.Normal, string currencyCode = "GBP",
                MerchantAccountType accountType = MerchantAccountType.Ecommerce, TxType txType = TxType.Payment)
        {
            string sagePayUrl = configuration.RegistrationUrl;
            string notificationUrl = urlResolver.BuildNotificationUrl();

            var registration = new TransactionRegistration(
                vendorTxCode, description, amount, notificationUrl,
                billingAddress, deliveryAddress, customerEmail,
                configuration.VendorName,
                currencyCode, paymentFormProfile, accountType, txType);

            var serializer = new HttpPostSerializer();
            var postData = serializer.Serialize(registration);

            var response = requestSender.SendRequest(sagePayUrl, postData);

            var deserializer = new ResponseSerializer();
            return deserializer.Deserialize<TransactionRegistrationResponse>(response);
        }
        //public object Send(RequestContext context, string vendorTxCode, ShoppingBasket basket,
        //                Address billingAddress, Address deliveryAddress, string customerEmail, PaymentFormProfile paymentFormProfile = PaymentFormProfile.Normal, string currencyCode = "GBP",
        //                MerchantAccountType accountType = MerchantAccountType.Ecommerce, TxType txType = TxType.Payment)
        //{
        //    string sagePayUrl = configuration.RegistrationUrl;
        //    string notificationUrl = urlResolver.BuildNotificationUrl();

        //    var registration = new TransactionRegistration(
        //        vendorTxCode, basket, notificationUrl,
        //        billingAddress, deliveryAddress, customerEmail,
        //        configuration.VendorName,
        //        currencyCode, paymentFormProfile, accountType, txType);

        //    var serializer = new HttpPostSerializer();
        //    var postData = serializer.Serialize(registration);

        //    var response = requestSender.SendRequest(sagePayUrl, postData);

        //    var deserializer = new ResponseSerializer();
        //    return deserializer.Deserialize<TransactionRegistrationResponse>(response);
        //}
    }
}
