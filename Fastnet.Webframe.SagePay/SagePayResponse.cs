using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Web.Security;

namespace Fastnet.Webframe.SagePay
{
    /// <summary>
    /// Base class for sage pay ActionResults
    /// </summary>
    public abstract class SagePayResult : ActionResult
    {
        readonly string vendorTxCode;

        protected SagePayResult(string vendorTxCode)
        {
            this.vendorTxCode = vendorTxCode;
        }

        protected string BuildFailedUrl(ControllerContext context)
        {
            var resolver = new DefaultUrlResolver();// UrlResolver.Current;
            return resolver.BuildFailedTransactionUrl(vendorTxCode);
        }

        protected string BuildSuccessUrl(ControllerContext context)
        {
            var resolver = new DefaultUrlResolver();// UrlResolver.Current;
            return resolver.BuildSuccessfulTransactionUrl(vendorTxCode);
        }
    }
    /// <summary>
    /// ActionResult to be returned for a valid order (irrespective of whether payment failed or succeeded)
    /// </summary>
    public class ValidOrderResult : SagePayResult
    {
        readonly SagePayResponse response;

        public ValidOrderResult(string vendorTxCode, SagePayResponse response) : base(vendorTxCode)
        {
            this.response = response;
        }

        public override void ExecuteResult(ControllerContext context)
        {
            context.HttpContext.Response.ContentType = "text/plain";

            if (response.Status == ResponseType.Error)
            {
                context.HttpContext.Response.Output.WriteLine("Status=INVALID");
            }
            else
            {
                context.HttpContext.Response.Output.WriteLine("Status=OK");
            }

            if (response.WasTransactionSuccessful)
            {
                context.HttpContext.Response.Output.WriteLine("RedirectURL={0}", BuildSuccessUrl(context));
            }
            else
            {
                context.HttpContext.Response.Output.WriteLine("RedirectURL={0}", BuildFailedUrl(context));
            }
        }
    }
    /// <summary>
    /// Action Result returned when an error occurs.
    /// </summary>
    public class ErrorResult : SagePayResult
    {
        public ErrorResult() : base(null)
        {
        }

        public override void ExecuteResult(ControllerContext context)
        {
            context.HttpContext.Response.ContentType = "text/plain";
            context.HttpContext.Response.Output.WriteLine("Status=ERROR");
            context.HttpContext.Response.Output.WriteLine("RedirectURL={0}", BuildFailedUrl(context));
            context.HttpContext.Response.Output.WriteLine("StatusDetail=An error occurred when processing the request.");
        }
    }
    /// <summary>
    /// Action Result to be returned when the transaction with the specified VendorTxCode could not be found.
    /// </summary>
    public class TransactionNotFoundResult : SagePayResult
    {
        public TransactionNotFoundResult(string vendorTxCode) : base(vendorTxCode)
        {
        }

        public override void ExecuteResult(ControllerContext context)
        {
            context.HttpContext.Response.ContentType = "text/plain";
            context.HttpContext.Response.Output.WriteLine("Status=INVALID");
            context.HttpContext.Response.Output.WriteLine("RedirectURL={0}", BuildFailedUrl(context));
            context.HttpContext.Response.Output.WriteLine("StatusDetail=Unable to find the transaction in our database.");
        }
    }
    /// <summary>
    /// Action result used when an invalid signature is returned from SagePay.
    /// </summary>
    public class InvalidSignatureResult : SagePayResult
    {
        public InvalidSignatureResult(string vendorTxCode) : base(vendorTxCode)
        {
        }

        public override void ExecuteResult(ControllerContext context)
        {
            context.HttpContext.Response.ContentType = "text/plain";
            context.HttpContext.Response.Output.WriteLine("Status=INVALID");
            context.HttpContext.Response.Output.WriteLine("RedirectURL={0}", BuildFailedUrl(context));
            context.HttpContext.Response.Output.WriteLine("StatusDetail=Cannot match the MD5 Hash. Order might be tampered with.");
        }
    }
    /// <summary>
    /// IModelBinder implementation for deserializing a notification post into a SagePayResponse object.
    /// </summary>
    public class SagePayBinder : IModelBinder
    {
        const string Status = "Status";
        const string VendorTxCode = "VendorTxCode";
        const string VPSTxId = "VPSTxId";
        const string VPSSignature = "VPSSignature";
        const string StatusDetail = "StatusDetail";
        const string TxAuthNo = "TxAuthNo";
        const string AVSCV2 = "AVSCV2";
        const string AddressResult = "AddressResult";
        const string PostCodeResult = "PostCodeResult";
        const string CV2Result = "CV2Result";
        const string GiftAid = "GiftAid";
        const string ThreeDSecureStatus = "3DSecureStatus";
        const string CAVV = "CAVV";
        const string AddressStatus = "AddressStatus";
        const string PayerStatus = "PayerStatus";
        const string CardType = "CardType";
        const string Last4Digits = "Last4Digits";
        const string DeclineCode = "DeclineCode";
        const string ExpiryDate = "ExpiryDate";
        const string FraudResponse = "FraudResponse";
        const string BankAuthCode = "BankAuthCode";

        public object BindModel(ControllerContext controllerContext, ModelBindingContext bindingContext)
        {
            var response = new SagePayResponse();
            response.Status = GetStatus(bindingContext.ValueProvider);
            response.VendorTxCode = GetFormField(VendorTxCode, bindingContext.ValueProvider);
            response.VPSTxId = GetFormField(VPSTxId, bindingContext.ValueProvider);
            response.VPSSignature = GetFormField(VPSSignature, bindingContext.ValueProvider);
            response.StatusDetail = GetFormField(StatusDetail, bindingContext.ValueProvider);
            response.TxAuthNo = GetFormField(TxAuthNo, bindingContext.ValueProvider);
            response.AVSCV2 = GetFormField(AVSCV2, bindingContext.ValueProvider);
            response.AddressResult = GetFormField(AddressResult, bindingContext.ValueProvider);
            response.PostCodeResult = GetFormField(PostCodeResult, bindingContext.ValueProvider);
            response.CV2Result = GetFormField(CV2Result, bindingContext.ValueProvider);
            response.GiftAid = GetFormField(GiftAid, bindingContext.ValueProvider);
            response.ThreeDSecureStatus = GetFormField(ThreeDSecureStatus, bindingContext.ValueProvider);
            response.CAVV = GetFormField(CAVV, bindingContext.ValueProvider);
            response.AddressStatus = GetFormField(AddressStatus, bindingContext.ValueProvider);
            response.PayerStatus = GetFormField(PayerStatus, bindingContext.ValueProvider);
            response.CardType = GetFormField(CardType, bindingContext.ValueProvider);
            response.Last4Digits = GetFormField(Last4Digits, bindingContext.ValueProvider);
            response.DeclineCode = GetFormField(DeclineCode, bindingContext.ValueProvider);
            response.ExpiryDate = GetFormField(ExpiryDate, bindingContext.ValueProvider);
            response.FraudResponse = GetFormField(FraudResponse, bindingContext.ValueProvider);
            response.BankAuthCode = GetFormField(BankAuthCode, bindingContext.ValueProvider);
            return response;
        }

        ResponseType GetStatus(IValueProvider valueProvider)
        {
            string value = GetFormField(Status, valueProvider);
            return ResponseSerializer.ConvertStringToSagePayResponseType(value);
        }

        string GetFormField(string key, IValueProvider provider)
        {
            ValueProviderResult result = provider.GetValue(key);

            if (result != null)
            {
                return (string)result.ConvertTo(typeof(string));
            }

            return null;
        }
    }
    /// <summary>
    /// Object that represents a notification POST from SagePay
    /// </summary>
    [ModelBinder(typeof(SagePayBinder))]
    public class SagePayResponse
    {
        public ResponseType Status { get; set; }
        public string VendorTxCode { get; set; }
        public string VPSTxId { get; set; }
        public string VPSSignature { get; set; }
        public string StatusDetail { get; set; }
        public string TxAuthNo { get; set; }
        public string AVSCV2 { get; set; }
        public string AddressResult { get; set; }
        public string PostCodeResult { get; set; }
        public string CV2Result { get; set; }
        public string GiftAid { get; set; }
        public string ThreeDSecureStatus { get; set; }
        public string CAVV { get; set; }
        public string AddressStatus { get; set; }
        public string PayerStatus { get; set; }
        public string CardType { get; set; }
        public string Last4Digits { get; set; }
        public string DeclineCode { get; set; }
        public string ExpiryDate { get; set; }
        public string FraudResponse { get; set; }
        public string BankAuthCode { get; set; }


        /// <summary>
        /// Was the transaction successful?
        /// </summary>
        public virtual bool WasTransactionSuccessful
        {
            get
            {
                return (Status == ResponseType.Ok ||
                        Status == ResponseType.Authenticated ||
                        Status == ResponseType.Registered);
            }
        }

        /// <summary>
        /// Is the signature valid
        /// </summary>
        public virtual bool IsSignatureValid(string securityKey, string vendorName)
        {
            return GenerateSignature(securityKey, vendorName) == VPSSignature;
        }

        /// <summary>
        /// Generates the VPS Signature from the parameters of the POST.
        /// </summary>
        public virtual string GenerateSignature(string securityKey, string vendorName)
        {
            var builder = new StringBuilder();
            builder.Append(VPSTxId);
            builder.Append(VendorTxCode);
            builder.Append(Status.ToString().ToUpper());
            builder.Append(TxAuthNo);
            builder.Append(vendorName.ToLower());
            builder.Append(AVSCV2);
            builder.Append(securityKey);
            builder.Append(AddressResult);
            builder.Append(PostCodeResult);
            builder.Append(CV2Result);
            builder.Append(GiftAid);
            builder.Append(ThreeDSecureStatus);
            builder.Append(CAVV);
            builder.Append(AddressStatus);
            builder.Append(PayerStatus);
            builder.Append(CardType);
            builder.Append(Last4Digits);
            builder.Append(DeclineCode);
            builder.Append(ExpiryDate);
            builder.Append(FraudResponse);
            builder.Append(BankAuthCode);
            var hash = FormsAuthentication.HashPasswordForStoringInConfigFile(builder.ToString(), "MD5");
            return hash;
        }
    }
}
