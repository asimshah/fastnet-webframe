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
        private ICollection<Menu2> menus;
        public long Id { get; set; }
        public string Name { get; set; }
        public PanelNames PanelName { get; set; }
        public virtual ICollection<Menu2> Menus
        {
            get { return menus ?? (menus = new HashSet<Menu2>()); }
            set { menus = value; }
        }
    }
    public partial class Menu2 : Hierarchy<Menu2>
    {
        public long Id { get; set; }
        public int Index { get; set; }
        public string Text { get; set; }
        public string Url { get; set; }
        public virtual Menu2 ParentMenu { get; set; }
        public virtual ICollection<Menu2> Submenus { get; set; }

        internal override Menu2 GetParent()
        {
            return ParentMenu;
        }

        internal override IEnumerable<Menu2> GetChildren()
        {
            return this.Submenus;
        }
    }
}
