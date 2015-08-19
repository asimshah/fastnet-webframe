using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{

    public class DWHMemberFactory : MemberFactory
    {
        protected override MemberBase CreateMemberInstance()
        {
            return new DWHMember();
        }
        public override MemberBase CreateNew(string id, dynamic data)
        {
            DWHMember m = CreateMemberInstance() as DWHMember;
            string emailAddress = data.emailAddress;
            //string password = data.password;
            string firstName = data.firstName;
            string lastName = data.lastName;
            Fill(m, id, emailAddress, firstName, lastName);
            //string bmc = data.bmcMembership?.Value ?? "";
            m.BMCMembership = ExtractBmcMembership(data);// bmc.Trim();
            // m.DateOfBirth = ExtractDob(data);// data.dob?.Value;
            //string dob = data.dob.Value ?? "";
            //if(!string.IsNullOrWhiteSpace(dob))
            //{
            //    m.DateOfBirth = DateTime.Parse(dob);
            //}

            m.Organisation = data.organisation?.Value ?? "";
            return m;
        }
        public string ExtractBmcMembership(dynamic data)
        {
            string bmcMembership = data.bmcMembership?.Value ?? "";
            return bmcMembership.Trim();
        }
        //public DateTime? ExtractDob(dynamic data)
        //{
        //    object r = data.dob?.Value ?? null;
        //    if (r is string)
        //    {
        //        DateTime dt;
        //        if (DateTime.TryParse((string)r, out dt))
        //        {
        //            return dt;
        //        }
        //    }
        //    if (r.GetType() == typeof(DateTime))
        //    {
        //        return (DateTime)r;
        //    }
        //    return null;

        //}
        public async override Task<ExpandoObject> ValidateRegistration(dynamic data)
        {
            string bmc = ExtractBmcMembership(data);
            //DateTime? dob = ExtractDob(data);
            return await ValidateRegistration(bmc);//, dob);
        }
        internal async Task<ExpandoObject> ValidateRegistration(string bmcMembership)//, DateTime? dob)
        {

            dynamic result = new ExpandoObject();
            //string BMCMembership = data.bmcMembership;
            if (!string.IsNullOrWhiteSpace(bmcMembership))
            {
                if (!BMCNumberInUse(bmcMembership))
                {
                    if (ApplicationSettings.Key("DWH:ValidateBMCMembership", true))
                    {
                        //string DateOfBirth = data.dob;
                        await Task.Delay(1000);
                        result.Success = false;
                        result.Error = "BMC Membership is invalid or not found";
                    }
                    else
                    {
                        result.Success = true;
                    }
                }
                else
                {
                    result.Success = false;
                    result.Error = "This BMC membership is already in use";
                }
            }
            else
            {
                result.Success = true;
            }
            return result;
        }
        private bool BMCNumberInUse(string bMCMembership)
        {
            var ctx = Core.GetDataContext();
            return ctx.Members.OfType<DWHMember>().Any(x => string.Compare(bMCMembership, x.BMCMembership, true) == 0);
        }
    }
}
