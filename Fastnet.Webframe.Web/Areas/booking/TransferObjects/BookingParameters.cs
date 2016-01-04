using Fastnet.Common;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class IGroup
    {
        public long Id { get; set; }
        public string Name { get; set; }
    }
    public class abode
    {
        public long id { get; set; }
        public string name { get; set; }        
    }
    public class bookingParameters
    {
        public string factoryName { get; set; }
        public IGroup[] availableGroups { get; set; }
        public string termsAndConditionsUrl { get; set; }
        public bool paymentGatewayAvailable { get; set; }
        public int maximumOccupants { get; set; }
        public abode currentAbode { get; set; }
        public List<abode> abodes { get; set; }
        public string today { get; set; }
        public void Save()
        {
            using (var ctx = new BookingDataContext())
            {
                var para = ctx.Parameters.Single();
                para.TermsAndConditionsUrl = this.termsAndConditionsUrl;
                BeforeSave(para);
                ctx.SaveChanges();
            }
        }
        protected virtual void BeforeSave(ParameterBase para)
        {
        }
        protected virtual void AfterLoad(CoreDataContext core, ParameterBase para)
        {

        }
        public void Load(CoreDataContext core)
        {
            using (var ctx = new BookingDataContext())
            {
                try
                {
                    var para = ctx.Parameters.Single();
                    var groups = core.Groups.Where(x => !x.Type.HasFlag(GroupTypes.System)).ToList();
                    //groups.Add(Group.AllMembers);
                    //groups.Add(Group.Administrators);                
                    groups.Add(Group.GetSystemGroup(SystemGroups.AllMembers, core));
                    groups.Add(Group.GetSystemGroup(SystemGroups.Administrators, core));
                    availableGroups = groups.OrderBy(x => x.Name).Select(x => new IGroup { Id = x.GroupId, Name = x.Name }).ToArray();
                    termsAndConditionsUrl = para.TermsAndConditionsUrl;

                    var allAccomodation = ctx.GetTotalAccomodation();
                    int bedCount = 0;
                    foreach (var accomodation in allAccomodation)
                    {
                        foreach (var item in accomodation.SelfAndDescendants)
                        {
                            if (item.Type == AccomodationType.Bed)
                            {
                                bedCount++;
                            }
                        }
                    }
                    maximumOccupants = bedCount;
                    abodes = ctx.AccomodationSet.Where(x => x.ParentAccomodation == null).Select(x => new abode { id = x.AccomodationId, name = x.Name }).ToList();
                    if (abodes.Count() == 1)
                    {
                        currentAbode = abodes.First();
                    }
                    else
                    {
                        throw new Exception("need method for current abode");
                    }
                    today = BookingGlobals.GetToday().ToDefault();
                    PaymentGateway pg = new PaymentGateway();
                    paymentGatewayAvailable = pg.Enabled;
                    AfterLoad(core, para);
                }
                catch (Exception)
                {
                    //Debugger.Break();
                    throw;
                }
            }
        }
    }
   
}