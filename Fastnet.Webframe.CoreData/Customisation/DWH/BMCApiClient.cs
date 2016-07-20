using Fastnet.EventSystem;
using Fastnet.Web.Common;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public enum BMCMembershipStatus
    {
        Current,
        Expired,
        NotFound,
        Missing,
        Unknown,
        Error
    }
    class BMCApiFactory : CustomFactory
    {
        public BMCApiFactory()
        {
            Debug.Assert(FactoryName == FactoryName.DonWhillansHut);
        }
        public static BMCApiClient GetClient()
        {
            //string BMCApiUser = Settings.parameters.BMCApiUser;
            //string BMCApiKey = Settings.parameters.BMCApiKey;
            //string BMCUrl = Settings.parameters.BMCUrl;
            string BMCApiUser = Settings.bmc.api.apiuser;
            string BMCApiKey = Settings.bmc.api.apikey;
            string BMCUrl = Settings.bmc.api.apiurl;
            return new BMCApiClient(BMCUrl, BMCApiUser, BMCApiKey);
        }
    }
    public class BMCApiClient : WebApiClient
    {
        private string BMCApiUser;
        private string BMCApiKey;

        internal BMCApiClient(string url, string BMCApiUser, string BMCApiKey) : base(url)
        {
            this.BMCApiUser = BMCApiUser;
            this.BMCApiKey = BMCApiKey;
        }
        public async Task<ExpandoObject> Validate(string bmcMembership, string lastName)
        {
            dynamic result = new ExpandoObject();
            result.ApiEnabled = true;
            try
            {
                string url = string.Format("MemberUpdate/QueryLight?lastName={0}&membershipNumber={1}&contentType=json&apiuser={2}&apikey={3}",
                    lastName, bmcMembership, BMCApiUser, BMCApiKey);
                ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
                dynamic r = await GetAsync(url);
                if (r is JObject)
                {
                    JObject jo = r as JObject;
                    dynamic r2 = jo.Value<dynamic>();
                    if (r2 != null)
                    {
                        string m = r2.Data.Result;
                        switch (m.ToLower())
                        {
                            case "not found":
                                result.Success = false;
                                result.Error = "No record found at the BMC";
                                result.Status = BMCMembershipStatus.NotFound;
                                break;
                            case "current":
                                result.Success = true;
                                result.Expiry = r2.Data.Expiry.Value;
                                result.Error = null;
                                result.Status = BMCMembershipStatus.Current;
                                break;
                            case "expired":
                                result.Success = false;
                                result.Expiry = r2.Data.Expiry.Value;
                                result.Error = "BMC membership has expired";
                                result.Status = BMCMembershipStatus.Expired;
                                break;
                        }
                    }
                }
                else
                {
                    result.Success = false;
                    result.Error = r.Error ?? "unknown error";
                    result.Status = BMCMembershipStatus.Error;
                }
                return result;
            }

            catch (Exception xe)
            {
                Log.Write(xe);
                //dynamic result = new ExpandoObject();
                result.Success = false;
                result.Error = xe.Message;
                result.Status = BMCMembershipStatus.Error;
                return result;
            }
        }
    }
}
