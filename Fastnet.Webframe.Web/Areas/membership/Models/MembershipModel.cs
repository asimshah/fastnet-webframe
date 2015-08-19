using Fastnet.Common;
using Fastnet.Webframe.Web.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.membership.Models
{
    public class MembershipOptions : OptionsModel
    {
        public bool VisiblePassword { get; set; }
        public bool EditablePassword { get; set; }
        public MembershipOptions()
        {
            //if (ApplicationSettings.Key("VisiblePassword", false))
            //{
            //    VisiblePassword = true;
            //}
            //if (ApplicationSettings.Key("Membership:EditablePassword", false))
            //{
            //    VisiblePassword = true;
            //    EditablePassword = true;
            //}
        }
    }
    public class MembershipModel : ViewModelBase
    {
        public MembershipOptions Options { get; set; }

        public MembershipModel()
        {
            this.Options = new MembershipOptions();
        }
        //public string ToJson()
        //{
        //    return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        //}
    }
}