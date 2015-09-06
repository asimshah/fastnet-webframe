using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Areas.booking
{
    public class IGroup {
        public long Id { get; set; }
        public string Name { get; set; }
    }
    public class AdminParameters : ICustomisable
    {
        public IGroup[] AvailableGroups { get; set; }
        public virtual void Save()
        {

        }
        public virtual void Customise()
        {
            
        }
    }

}