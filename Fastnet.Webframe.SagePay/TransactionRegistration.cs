using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.SagePay
{
    public class TransactionRegistration
    {
        readonly ShoppingBasket basket;
        readonly decimal amount;
        readonly string description;
        readonly Address billingAddress;
        readonly Address deliveryAddress;
        readonly string customerEMail;
        readonly string vendorName;
        readonly string profile;
        readonly string accountType;
        readonly string currency;
        readonly string txType;

        const string NormalFormMode = "NORMAL";
        const string LowProfileFormMode = "LOW";

        const string AccountTypeEcommerce = "E";
        const string AccountTypeMailOrder = "M";

        const string TxTypePayment = "PAYMENT";
        const string TxTypeDeferred = "DEFERRED";
        const string TxTypeAuthenticate = "AUTHENTICATE";
        public TransactionRegistration(string vendorTxCode, string description, decimal amount, string notificationUrl,
            Address billingAddress, Address deliveryAddress, string customerEmail,
            string vendorName, string currencyCode, PaymentFormProfile paymentFormProfile,
            MerchantAccountType accountType, TxType txType)
        {
            VendorTxCode = vendorTxCode;
            NotificationURL = notificationUrl;
            this.description = description;
            this.amount = amount;
            this.billingAddress = billingAddress;
            this.deliveryAddress = deliveryAddress;
            customerEMail = customerEmail;
            this.vendorName = vendorName;
            switch (paymentFormProfile)
            {
                case PaymentFormProfile.Low:
                    profile = LowProfileFormMode;
                    break;
                default:
                    profile = NormalFormMode;
                    break;
            }
            switch (accountType)
            {
                case MerchantAccountType.MailOrder:
                    this.accountType = AccountTypeMailOrder;
                    break;
                default:
                    this.accountType = AccountTypeEcommerce;
                    break;
            }
            this.currency = currencyCode;
            this.txType = txType.ToString().ToUpperInvariant();
        }
        public TransactionRegistration(string vendorTxCode, ShoppingBasket basket, string notificationUrl,
            Address billingAddress, Address deliveryAddress, string customerEmail,
            string vendorName, string currencyCode, PaymentFormProfile paymentFormProfile,
            MerchantAccountType accountType, TxType txType)
        {
            VendorTxCode = vendorTxCode;
            NotificationURL = notificationUrl;
            this.basket = basket;
            this.billingAddress = billingAddress;
            this.deliveryAddress = deliveryAddress;
            customerEMail = customerEmail;
            this.vendorName = vendorName;
            switch (paymentFormProfile)
            {
                case PaymentFormProfile.Low:
                    profile = LowProfileFormMode;
                    break;
                default:
                    profile = NormalFormMode;
                    break;
            }
            switch (accountType)
            {
                case MerchantAccountType.MailOrder:
                    this.accountType = AccountTypeMailOrder;
                    break;
                default:
                    this.accountType = AccountTypeEcommerce;
                    break;
            }
            this.currency = currencyCode;
            this.txType = txType.ToString().ToUpperInvariant();
        }

        //public string VPSProtocol
        //{
        //    get { return Configuration.ProtocolVersion; }
        //}

        public string TxType
        {
            get { return txType; }
        }

        public string Vendor
        {
            get { return vendorName; }
        }

        public string VendorTxCode { get; private set; }

        [Format("f2")]
        public decimal Amount
        {
            get
            {
                if (basket == null)
                {
                    return amount;
                }
                else
                {
                    return basket.Total;
                }
            }
        }

        public string Currency
        {
            get { return currency; }
        }

        public string Description
        {
            get
            {
                if (basket == null)
                {
                    return description;
                }
                else
                {
                    return basket.Name;
                }
                //return basket.Name;
            }
        }

        [Unencoded]
        public string NotificationURL { get; private set; }

        public string BillingSurname
        {
            get { return billingAddress.Surname; }
        }

        public string BillingFirstnames
        {
            get { return billingAddress.Firstnames; }
        }

        public string BillingAddress1
        {
            get { return billingAddress.Address1; }
        }

        [Optional]
        public string BillingAddress2
        {
            get { return billingAddress.Address2; }
        }

        public string BillingCity
        {
            get { return billingAddress.City; }
        }

        public string BillingPostCode
        {
            get { return billingAddress.PostCode; }
        }

        public string BillingCountry
        {
            get { return billingAddress.Country; }
        }

        [Optional]
        public string BillingState
        {
            get { return billingAddress.State; }
        }

        [Optional]
        public string BillingPhone
        {
            get { return billingAddress.Phone; }
        }

        public string DeliverySurname
        {
            get { return deliveryAddress.Surname; }
        }

        public string DeliveryFirstnames
        {
            get { return deliveryAddress.Firstnames; }
        }

        public string DeliveryAddress1
        {
            get { return deliveryAddress.Address1; }
        }

        [Optional]
        public string DeliveryAddress2
        {
            get { return deliveryAddress.Address2; }
        }

        public string DeliveryCity
        {
            get { return deliveryAddress.City; }
        }

        public string DeliveryPostCode
        {
            get { return deliveryAddress.PostCode; }
        }

        public string DeliveryCountry
        {
            get { return deliveryAddress.Country; }
        }

        [Optional]
        public string DeliveryState
        {
            get { return deliveryAddress.State; }
        }

        [Optional]
        public string DeliveryPhone
        {
            get { return deliveryAddress.Phone; }
        }

        public string CustomerEMail
        {
            get { return customerEMail; }
        }

        public string Basket
        {
            get { return basket?.ToString(); }
        }

        //NOTE: Not currently supported
        public int AllowGiftAid
        {
            get { return 0; }
        }

        public int Apply3DSecure
        {
            get { return 0; }
        }

        public string Profile
        {
            get { return profile; }
        }

        public string AccountType
        {
            get { return accountType; }
        }
    }
}
