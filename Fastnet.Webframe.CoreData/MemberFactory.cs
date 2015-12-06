using Fastnet.Web.Common;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public class MemberFactory : CustomFactory
    {
        private static MemberFactory instance;
        public static MemberFactory GetInstance()
        {
            if (instance == null)
            {
                MemberFactory mf = null;
                switch (FactoryName)
                {
                    case FactoryName.None:
                        mf = new MemberFactory();
                        break;
                    case FactoryName.DonWhillansHut:
                        mf = new DWHMemberFactory();
                        break;
                }
                instance = mf;
            }
            return instance;
        }
        protected virtual MemberBase CreateMemberInstance()
        {
            return new Member();
        }
        protected virtual void Fill(MemberBase member, string id, string emailAddress, string firstName, string lastName)
        {
            member.Id = id;
            member.EmailAddress = emailAddress;
            member.FirstName = firstName;
            member.LastName = lastName;
            member.CreationDate = DateTime.UtcNow;
        }
        public virtual MemberBase CreateNew(string id, dynamic data, object additionalData)
        {
            MemberBase member = CreateMemberInstance();

            string emailAddress = data.emailAddress;
            //string password = data.password;
            string firstName = data.firstName;
            string lastName = data.lastName;
            Fill(member, id, emailAddress, firstName, lastName);
            return member;
        }
        public virtual MemberBase Find(CoreDataContext ctx, string id)
        {
            return ctx.Members.Find(id) as Member;
        }
        public async virtual Task<ExpandoObject> ValidateRegistration(dynamic data)
        {
            dynamic result = new ExpandoObject();
            result.Success = true;
            result.Error = "";
            return await Task.FromResult(result);
        }
        public virtual void AssignGroups(MemberBase member)
        {
            if (Group.AllMembers.Members.SingleOrDefault(x => x.Id == member.Id) == null)
            {
                Group.AllMembers.Members.Add(member);
            }
        }
    }
}
