using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Common
{
    public static class Globals
    {
        private static string adminEmailAddress = null;
        public static string AdminEmailAddress
        {
            get
            {
                if (adminEmailAddress == null)
                {
                    adminEmailAddress = GetAdminEmailAddress();
                }
                return adminEmailAddress;
            }
        }
        private static string GetAdminEmailAddress()
        {
            using (CoreDataContext DataContext = new CoreDataContext())
            {
                MemberBase adminMember = DataContext.Members.Single(m => m.IsAdministrator);
                return adminMember.EmailAddress;
            }
        }
    }
}