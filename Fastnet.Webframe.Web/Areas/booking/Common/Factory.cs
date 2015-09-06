using Fastnet.Web.Common;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class Factory : CustomFactory
    {
        public static MemberInfo GetMemberInfo()
        {
            switch(FactoryName)
            {
                case FactoryName.None:
                    return new MemberInfo();
                case FactoryName.DonWhillansHut:
                    return new DWHMemberInfo();
            }
            throw new ApplicationException("Unable to create a MemberInfo instance");
        }
        public static AdminParameters GetAdminParameters(dynamic data = null)
        {
            switch (FactoryName)
            {
                case FactoryName.DonWhillansHut:
                    if(data != null)
                    {
                        return ((JObject)data).ToObject<DWHAdminParameters>();
                    }
                    return new DWHAdminParameters();
            }
            if (data != null)
            {
                return ((JObject)data).ToObject<AdminParameters>();
            }
            return new AdminParameters();
        }
    }
    public interface ICustomisable
    {
        void Customise();
    }
}