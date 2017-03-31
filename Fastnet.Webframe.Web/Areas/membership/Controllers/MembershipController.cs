using Fastnet.EventSystem;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.WebApi;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Transactions;
using System.Web;
using System.Web.Http;
using cd = Fastnet.Webframe.CoreData;

namespace Fastnet.Webframe.Web.Areas.membership.Controllers
{
    [RoutePrefix("membershipapi")]
    [PermissionFilter(SystemGroups.Administrators)]
    public class MembershipController : BaseApiController // : ApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        //public MembershipController() : this(null)
        //{

        //}
        //public MembershipController(CoreDataContext ctx)
        //{
        //    if (ctx == null)
        //    {
        //        DataContext = Core.GetDataContext();
        //    }
        //    else
        //    {
        //        DataContext = ctx;
        //    }
        //}
        [HttpGet]
        [Route("banner")]
        public HttpResponseMessage GetBannerHtml()
        {
            //PageContent bannerContent = DataContext.GetDefaultLandingPage()[ContentPanels.Banner];
            PageContent bannerContent = Member.Anonymous.FindLandingPage()[PageType.Banner];
            if (bannerContent != null)
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = true, Styles = bannerContent.HtmlStyles, Html = bannerContent.HtmlText });
            }
            else
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = false });
            }
        }
        [HttpGet]
        [Route("get/groups/{parentId?}")]
        public async Task<HttpResponseMessage> GetGroups(long? parentId = null)
        {
            IEnumerable<cd.Group> groups = null;
            cd.Group parent = null;
            if (parentId.HasValue)
            {
                parent = await DataContext.Groups.FindAsync(parentId.Value);
                groups = await DataContext.Groups.Where(x => x.ParentGroupId == parent.GroupId).OrderBy(x => x.Name).ToArrayAsync();
            }
            else
            {
                cd.Group[] list = new cd.Group[1];
                list[0] = await DataContext.Groups.SingleAsync(x => x.ParentGroup == null);
                groups = list;
            }

            var result = groups.Select(x => x.GetClientSideGroupDetails());
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("get/group/{groupId}")]
        public async Task<HttpResponseMessage> GetGroupDetails(long groupId)
        {
            cd.Group group = await DataContext.Groups.FindAsync(groupId);
            var members = group.Members.Where(m => !m.IsAdministrator).OrderBy(x => x.LastName);
            var resultMembers = members.Select(m => m.GetMinimumDetails());
            var result = new
            {
                Group = group.GetClientSideGroupDetails(),
                Members = resultMembers,// members.Select(m => GetClientSideMemberIndexDetails(m))                
                HasMembers = resultMembers.Count() > 0
            };
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("get/candidatemembers/{groupId}")]
        public async Task<HttpResponseMessage> GetCandidateMembers(long groupId)
        {
            cd.Group group = await DataContext.Groups.FindAsync(groupId);
            var members = await DataContext.Members.Where(m => !m.IsAdministrator && !m.IsAnonymous).ToArrayAsync();
            //var groupMembers = group.Members.ToArrayAsync();
            var candidates = members.Except(group.Members.ToArray()).OrderBy(x => x.LastName);
            var resultCandidates = candidates.Select(m => m.GetMinimumDetails());
            var result = new
            {
                Members = resultCandidates,
                HasMembers = resultCandidates.Count() > 0
            };
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpPost]
        [Route("delete/group")]
        public async Task<HttpResponseMessage> DeleteGroup(dynamic data)
        {
            long groupId = data.groupId;
            List<cd.Group> childGroups = new List<cd.Group>();
            Action<cd.Group> deleteChildren = null;
            deleteChildren = (g) =>
            {
                var childgroups = g.Children.ToArray();
                foreach (var cg in childgroups)
                {
                    deleteChildren(cg);
                }
                DataContext.Groups.Remove(g);
            };
            cd.Group group = await DataContext.Groups.FindAsync(groupId);
            deleteChildren(group);
            DataContext.Groups.Remove(group);
            group.RecordChanges(this.GetCurrentMember().Fullname, GroupAction.GroupActionTypes.Deletion);
            await DataContext.SaveChangesAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpPost]
        [Route("update/group")]
        public async Task<HttpResponseMessage> UpdateGroup(dynamic data)
        {
            Action<int, IEnumerable<cd.Group>> changeWeights = null;
            changeWeights = (incr, subgroups) =>
            {
                foreach (var sg in subgroups)
                {
                    sg.Weight += incr;
                    sg.RecordChanges(this.GetCurrentMember().Fullname, GroupAction.GroupActionTypes.Modification);
                    changeWeights(incr, sg.Children);
                }
            };
            long groupId = data.groupId;
            string name = data.name;
            string description = data.descr;
            int weight = data.weight;
            bool updateChildren = data.updateChildren;
            cd.Group group = await DataContext.Groups.FindAsync(groupId);
            group.Name = name;
            group.Description = description;
            if (group.Weight != weight)
            {
                int increment = weight - group.Weight;
                group.Weight = weight;
                if (updateChildren)
                {
                    changeWeights(increment, group.Children);
                }
            }
            group.RecordChanges(this.GetCurrentMember().Fullname, GroupAction.GroupActionTypes.Modification);
            await DataContext.SaveChangesAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpPost]
        [Route("add/group")]
        public async Task<HttpResponseMessage> AddGroup(dynamic data)
        {
            int weightIncrement = cd.Group.GetWeightIncrement();
            Func<IEnumerable<string>, string> getUniqueName = (existingNames) =>
           {
               string fmt = "New Group";
               int count = 1;
               bool finished = false;
               string result = fmt;
               do
               {
                   if (!existingNames.Contains(result, StringComparer.InvariantCultureIgnoreCase))
                   {
                       finished = true;
                   }
                   else
                   {
                       result = string.Format("{0} ({1})", fmt, ++count);
                   }
               } while (!finished);
               return result;
           };
            long groupId = data.groupId;
            cd.Group group = await DataContext.Groups.FindAsync(groupId);
            string name = getUniqueName(group.Children.Select(x => x.Name));
            cd.Group ng = new cd.Group
            {
                ParentGroup = group,
                Name = name,
                Description = "",
                Weight = group.Weight + weightIncrement
            };
            DataContext.Groups.Add(ng);
            ng.RecordChanges(this.GetCurrentMember().Fullname, GroupAction.GroupActionTypes.New);
            await DataContext.SaveChangesAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK, new { groupId = ng.GroupId });
        }
        [HttpPost]
        [Route("add/groupmembers")]
        public async Task<HttpResponseMessage> AddGroupMembers(dynamic data)
        {
            long groupId = data.groupId;
            JArray membersArray = data.members;
            string[] members = membersArray.ToObject<string[]>();
            cd.Group group = await DataContext.Groups.FindAsync(groupId);
            foreach (string key in members)
            {
                MemberBase m = await DataContext.Members.FindAsync(key);
                group.Members.Add(m);
                group.RecordChanges(this.GetCurrentMember().Fullname, GroupAction.GroupActionTypes.MemberAddition, m.EmailAddress);
            }
            await DataContext.SaveChangesAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpPost]
        [Route("delete/groupmembers")]
        public async Task<HttpResponseMessage> DeleteGroupMembers(dynamic data)
        {
            long groupId = data.groupId;
            JArray membersArray = data.members;
            string[] members = membersArray.ToObject<string[]>();
            cd.Group group = await DataContext.Groups.FindAsync(groupId);
            foreach (string key in members)
            {
                MemberBase m = await DataContext.Members.FindAsync(key);
                group.Members.Remove(m);
                group.RecordChanges(this.GetCurrentMember().Fullname, GroupAction.GroupActionTypes.MemberRemoval, m.EmailAddress);
            }
            await DataContext.SaveChangesAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpGet]
        [Route("get/member/{memberId}")]
        public async Task<HttpResponseMessage> GetMemberDetails(string memberId)
        {
            var member = await DataContext.Members.FindAsync(memberId);
            //string plainPassword = string.Empty;
            //var options = new MembershipOptions();
            //if (options.VisiblePassword)
            //{
            //    plainPassword = member.PlainPassword;
            //}
            var result = member.GetMemberListDetails();
            //var result = new
            //{
            //    Id = member.Id,
            //    EmailAddress = member.EmailAddress,
            //    FirstName = member.FirstName,
            //    LastName = member.LastName,
            //    Disabled = member.Disabled,
            //    IsAdministrator = member.IsAdministrator,
            //    CreationDate = member.CreationDate.ToString("ddMMMyyyy HH:mm:ss"),
            //    LastLoginDate = member.LastLoginDate.HasValue ? member.LastLoginDate.Value.ToString("ddMMMyyyy HH:mm:ss") : null,
            //    EmailConfirmed = member.EmailAddressConfirmed,
            //    PlainPassword = plainPassword
            //};

            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("getbyemail/member/{email}/")]
        public async Task<HttpResponseMessage> GetMemberDetailsByEmail(string email)
        {
            var member = await DataContext.Members.Where(z => z.EmailAddress == email).Include(xx => xx.Groups).FirstOrDefaultAsync();
            var result = member.GetMemberListDetails();
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("get/members/{searchtext}/{prefix?}")]
        public async Task<HttpResponseMessage> GetMembers(string searchText, bool prefix = false)
        {
            var members = await FindMembers(searchText, prefix);
            var result = members.Select(m => m.GetMinimumDetails());
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("get/members/all")]
        public async Task<dynamic> GetAllMembers()
        {
            var members = await DataContext.Members.Where(m => !m.IsAnonymous).ToArrayAsync();
            var result = members.Select(m => m.GetMemberListDetails());
            return result;
            //return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpPost]
        [Route("create/member")]
        public async Task<HttpResponseMessage> CreateMember(dynamic data)
        {
            string emailAddress = data.emailAddress;
            string firstName = data.firstName;
            string lastName = data.lastName;
            string password = data.password;
            //bool isDisabled = data.isDisabled ?? false;
            bool isDisabled = data.isDisabled?.Value ?? false;

            Debug.Assert(emailAddress != null);
            Debug.Assert(firstName != null);
            Debug.Assert(lastName != null);
            Debug.Assert(password != null);
            //Debug.Print("Creating {0} .", emailAddress);
            MemberFactory mf = MemberFactory.GetInstance();
            dynamic r = await mf.ValidateRegistration(data);
            if (r.Success || r.ApiEnabled == false)
            {
                //using (TransactionScope tran = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
                //{
                    try
                    {
                        //r.Success, etc
                        var user = new ApplicationUser { UserName = emailAddress, Email = emailAddress };
                        var appUserManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
                        IdentityResult result = await appUserManager.CreateAsync(user, password);
                        if (result.Succeeded)
                        {
                            var member = mf.CreateNew(user.Id, data, r);
                            DataContext.Members.Add(member);
                            //cd.Group.AllMembers.Members.Add(member);
                            member.ActivationCode = Guid.NewGuid().ToString();
                            member.ActivationEmailSentDate = DateTime.UtcNow;
                            member.RecordChanges(this.GetCurrentMember().Fullname, MemberAction.MemberActionTypes.New);
                            //await DataContext.SaveChangesAsync();
                            DataContext.SaveChanges();
                            mf.AssignGroups(member);
                            //await DataContext.SaveChangesAsync();
                            DataContext.SaveChanges();
                            MailHelper mh = new MailHelper();
                            mh.SendAccountActivationAsync(DataContext, member.EmailAddress, this.Request.RequestUri.Scheme, this.Request.RequestUri.Authority, member.Id, member.ActivationCode);
                            //tran.Complete();
                            Log.Write("Member {0} created", member.EmailAddress);
                            return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = true });
                        }
                        else
                        {
                            return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = false, Error = result.Errors.First() });
                        }
                    }
                    catch (Exception xe)
                    {
                        Log.Write(xe);
                        return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = false, Error = "Internal System Error!" });
                        throw;
                    }
                //}
            }
            else
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = r.Success, Error = r.Error });
            }
        }
        [HttpPost]
        [Route("delete/member")]
        public async Task<HttpResponseMessage> DeleteMember(dynamic data)
        {
            //MembershipOptions options = new MembershipOptions();
            string id = data.id;
            using (TransactionScope tran = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            {
                try
                {
                    MemberBase m = await DataContext.Members.Where(z => z.Id == id).Include(xx => xx.Groups).FirstOrDefaultAsync();                    
                    if (!m.IsAdministrator && !m.IsAnonymous)
                    {
                        var appUserManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
                        ApplicationUser user = await appUserManager.FindByIdAsync(id);
                        if (user != null)
                        {
                            await appUserManager.DeleteAsync(user);
                        }
                        else
                        {
                            Log.Write(EventSeverities.Warning, "DeleteMember(): Member {0}, (id {1}) not found in Identity database", m.EmailAddress, m.Id);
                        }
                        var groups = m.Groups.ToArray();
                        foreach (Fastnet.Webframe.CoreData.Group g in groups)
                        {
                            g.Members.Remove(m);
                        }
                        m.RecordChanges(this.GetCurrentMember().Fullname, MemberAction.MemberActionTypes.Deletion);
                        DataContext.Members.Remove(m);
                        await DataContext.SaveChangesAsync();
                        Debug.Print("Member {0} ({1}) deleted", m.EmailAddress, m.Id);
                        tran.Complete();
                    }
                    return this.Request.CreateResponse(HttpStatusCode.OK);
                }
                catch (Exception xe)
                {
                    Log.Write(xe);
                    throw;
                }
            }
        }
        [HttpPost]
        [Route("update/member")]
        public async Task<HttpResponseMessage> UpdateMember(dynamic data)
        {
            try
            {
                string id = data.id;
                string newEmailAddress = data.emailAddress;
                MemberBase m = await DataContext.Members.FindAsync(id);
                string oldEmailAddress = m.EmailAddress.ToLower();
                newEmailAddress = newEmailAddress.ToLower();
                bool emailAddressChanged = oldEmailAddress != newEmailAddress;
                dynamic r = await m.Update(data);
                if (r.Success)
                {
                    //using (TransactionScope tran = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
                    //{
                        try
                        {
                            if (emailAddressChanged)// || passwordHasChanged)
                            {
                                // need to update the identity system
                                var appUserManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
                                var user = await appUserManager.FindByIdAsync(id);
                                user.Email = newEmailAddress;
                                user.UserName = newEmailAddress;
                                await appUserManager.UpdateAsync(user);
                                m.EmailAddressConfirmed = false;
                                m.ActivationCode = Guid.NewGuid().ToString();
                                m.ActivationEmailSentDate = DateTime.UtcNow;
                            }
                            m.RecordChanges(this.GetCurrentMember().Fullname);
                            await DataContext.SaveChangesAsync();
                            if (emailAddressChanged)
                            {
                                MailHelper mh = new MailHelper();
                                var request = HttpContext.Current.Request;
                                mh.SendEmailAddressChangedAsync(DataContext, m.EmailAddress, request.Url.Scheme, request.Url.Authority, m.Id, m.ActivationCode);
                                m.RecordChanges(this.GetCurrentMember().Fullname, MemberAction.MemberActionTypes.Deactivation);
                                await DataContext.SaveChangesAsync();
                            }
                            //tran.Complete();
                            return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = true, MemberDetails = m.GetMemberListDetails() });
                        }
                        catch (Exception xe)
                        {
                            Log.Write(xe);
                            return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = false, Error = xe.Message });
                        }
                    //}
                }
                else
                {
                    return this.Request.CreateResponse(HttpStatusCode.OK, (object)r);
                }
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = false, Error = xe.Message });
            }
        }
        [HttpPost]
        [Route("send/activationmail")]
        public async Task<HttpResponseMessage> SendActivationEmail(dynamic data)
        {
            string id = data.id;
            MemberBase m = await DataContext.Members.FindAsync(id);
            bool currentlyActive = m.EmailAddressConfirmed;
            var appUserManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var user = await appUserManager.FindByIdAsync(id);
            user.EmailConfirmed = false;
            m.EmailAddressConfirmed = false;
            m.ActivationCode = Guid.NewGuid().ToString();
            m.ActivationEmailSentDate = DateTime.UtcNow;
            await appUserManager.UpdateAsync(user);
            if (currentlyActive)
            {
                m.RecordChanges(this.GetCurrentMember().Fullname, MemberAction.MemberActionTypes.Deactivation);
            }
            await DataContext.SaveChangesAsync();
            MailHelper mh = new MailHelper();
            mh.SendAccountActivationAsync(DataContext, m.EmailAddress, this.Request.RequestUri.Scheme, this.Request.RequestUri.Authority, m.Id, m.ActivationCode);
            var r = (object)m.GetMinimumDetails();
            return this.Request.CreateResponse(HttpStatusCode.OK, r);
        }
        [HttpPost]
        [Route("send/passwordresetrequest")]
        public async Task<HttpResponseMessage> SendPasswordResetRequest(dynamic data)
        {
            string id = data.id;
            MemberBase member = await DataContext.Members.FindAsync(id);
            member.PasswordResetCode = Guid.NewGuid().ToString();
            member.PasswordResetEmailSentDate = DateTime.UtcNow;
            member.RecordChanges(this.GetCurrentMember().Fullname, MemberAction.MemberActionTypes.PasswordResetRequest);
            await DataContext.SaveChangesAsync();
            MailHelper mh = new MailHelper();
            mh.SendPasswordResetAsync(DataContext, member.EmailAddress, this.Request.RequestUri.Scheme, this.Request.RequestUri.Authority, member.Id, member.PasswordResetCode);
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        [HttpGet]
        [Route("validate/member/{memberId}")]
        public async Task<HttpResponseMessage> ValidateMember(string memberId)
        {
            MemberBase m = await DataContext.Members.Where(z => z.Id == memberId)
                .FirstOrDefaultAsync();
            if(m != null)
            {
                var appUserManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
                ApplicationUser user = await appUserManager.FindByIdAsync(memberId);
                if (user != null)
                {
                    if (user.Email == user.UserName
                        && user.Email == m.EmailAddress)
                    {
                        return this.Request.CreateResponse(HttpStatusCode.OK, new { Valid = true });
                    }
                    else
                    {
                        return this.Request.CreateResponse(HttpStatusCode.OK, new { Valid = false, Error = "Member entries are inconsistent" });
                    }
                }
                else
                {
                    return this.Request.CreateResponse(HttpStatusCode.OK, new { Valid = false, Error = "Member not found in Identity db" });
                }
            }
            else
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Valid = false, Error = "Member not found in Core db" });
            }
            
        }
        private async Task<IEnumerable<MemberBase>> FindMembers(string searchText, bool prefix)
        {
            Func<string, string, bool> match = (fn, ln) =>
            {
                if (searchText.Contains("*"))
                {
                    while (searchText.Contains("**"))
                    {
                        searchText = searchText.Replace("**", "*");
                    }
                    searchText = searchText.Replace("*", ".*?");
                    Regex regex = new Regex(searchText);
                    return regex.IsMatch(fn) || regex.IsMatch(ln);
                }
                else if (prefix)
                {
                    if (searchText == "#")
                    {
                        bool result = !(fn.Length > 0 && char.IsLetter(fn, 0) || ln.Length > 0 && char.IsLetter(ln, 0));
                        return result;
                    }
                    else
                    {
                        return fn.StartsWith(searchText, StringComparison.InvariantCultureIgnoreCase) || ln.StartsWith(searchText, StringComparison.InvariantCultureIgnoreCase);
                    }
                }
                else
                {
                    string name = fn + " " + ln;
                    return name.IndexOf(searchText, StringComparison.InvariantCultureIgnoreCase) >= 0;
                }
            };
            bool currentIsAdministrator = this.GetCurrentMember().IsAdministrator;
            var temp = await DataContext.Members
                .Where(x => (currentIsAdministrator || x.IsAdministrator == false) && !x.IsAnonymous)
                .Select(m => new { Id = m.Id, m.FirstName, m.LastName }).ToArrayAsync();

            var selectedMembers = temp.Where(x => match(x.FirstName, x.LastName));
            var keys = selectedMembers.Select(x => x.Id);
            return await DataContext.Members.Where(x => keys.Contains(x.Id)).OrderBy(x => x.LastName).ToArrayAsync();
        }
    }
}
