using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{

    public partial class DWHMember : MemberBase
    {
        [MaxLength(128)]
        public string BMCMembership { get; set; }
        public DateTime? BMCMembershipExpiresOn { get; set; }
        public bool BMCMembershipIsValid { get; set; }
        public DateTime? BMCMembershipValidatedOn { get; set; }
        [MaxLength(128)]
        public string Organisation { get; set; }

        internal DWHMember()
        {

        }
        public override ExpandoObject GetMemberListDetails()
        {
            dynamic details = base.GetMemberListDetails();
            details.Organisation = this.Organisation;
            details.BMCMembership = this.BMCMembership;
            //details.DateOfBirth = this.DateOfBirth?.ToString("ddMMMyyyy");
            details.PhoneNumber = this.PhoneNumber;
            return details;
        }
        public override async Task<ExpandoObject> Update(dynamic data)
        {
            string newEmailAddress = data.emailAddress;
            string newFirstName = data.firstName;
            string newLastName = data.lastName;
            bool newDisabled = data.isDisabled;

            DWHMemberFactory mf = MemberFactory.GetInstance() as DWHMemberFactory;
            string newBmcMembership = mf.ExtractBmcMembership(data);
            //DateTime? newDob = mf.ExtractDob(data);
            bool needsRevalidation = false;
            if (newBmcMembership != this.BMCMembership) // || newDob != this.DateOfBirth)
            {
                needsRevalidation = true;
            }
            dynamic r = new ExpandoObject();
            r.Success = true;
            if (needsRevalidation)
            {
                this.BMCMembershipIsValid = false;
                this.BMCMembershipValidatedOn = null;
                r = await mf.ValidateRegistration(data);//, newDob);
            }
            if (r.Success)
            {
                if(needsRevalidation)
                {
                    this.BMCMembershipIsValid = true;
                    this.BMCMembershipValidatedOn = DateTime.Now;
                    mf.AssignGroups(this);
                }
                Update(newEmailAddress, newFirstName, newLastName, newDisabled);
                string newOrganisation = data.organisation?.Value ?? "";
                BMCMembership = newBmcMembership;
                Organisation = newOrganisation;
            }
            return r;

        }
    }
}
