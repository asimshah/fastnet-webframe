using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class DWHAdminParameters : AdminParameters
    {
        public IGroup NoBMCCheckGroup { get; set; }
        public override void Save()
        {
            base.Save();
            using (var ctx = new BookingDataContext())
            {
                var para = ctx.Parameters.OfType<DWHParameter>().Single();
                if (this.NoBMCCheckGroup == null)
                {
                    para.NoBMCCheckGroup = null;
                }
                else
                {
                    para.NoBMCCheckGroup = this.NoBMCCheckGroup.Name;
                }
                ctx.SaveChanges();
            }
        }
        public override void Customise()
        {
            using (var ctx = new BookingDataContext())
            {
                var para = ctx.Parameters.OfType<DWHParameter>().Single();
                if (!string.IsNullOrWhiteSpace(para.NoBMCCheckGroup))
                {
                    using (CoreDataReadOnly core = new CoreDataReadOnly())
                    {
                        Group NoBMCCheckGroup = core.Groups.SingleOrDefault(g => g.Name == para.NoBMCCheckGroup);
                        this.NoBMCCheckGroup = new IGroup { Id = NoBMCCheckGroup.GroupId, Name = NoBMCCheckGroup.Name };
                    }
                }
            }
        }
    }
}