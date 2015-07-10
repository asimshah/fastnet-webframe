using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public enum PanelNames
    {
        SitePanel,
        BannerPanel,
        MenuPanel,
        ContentPanel,
        LeftPanel,
        CentrePanel,
        RightPanel
    }
    public partial class MenuMaster
    {
        private ICollection<Menu> menus;
        public long Id { get; set; }
        public string Name { get; set; }
        public bool IsDisabled { get; set; }
        public PanelNames PanelName { get; set; }
        public virtual ICollection<Menu> Menus
        {
            get { return menus ?? (menus = new HashSet<Menu>()); }
            set { menus = value; }
        }
    }
}
