using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public enum PanelNames
    {
        [Description("None")]
        None,
        [Description("Site Panel")]
        SitePanel,
        [Description("Banner Panel")]
        BannerPanel,
        [Description("Menu Panel")]
        MenuPanel,
        [Description("Content Panel")]
        ContentPanel,
        [Description("Left Panel")]
        LeftPanel,
        [Description("Centre Panel")]
        CentrePanel,
        [Description("Right Panel")]
        RightPanel
    }
    public partial class MenuMaster
    {
        private ICollection<Menu> menus;
        public long Id { get; set; }
        public string Name { get; set; }
        public bool IsDisabled { get; set; }
        public string ClassName { get; set; }
        public PanelNames PanelName { get; set; }
        public virtual Page Page { get; set; }
        public virtual ICollection<Menu> Menus
        {
            get { return menus ?? (menus = new HashSet<Menu>()); }
            set { menus = value; }
        }
        public string GetDescriptor()
        {
            if (PanelName == PanelNames.MenuPanel)
            {
                return "(for Menu Panel)";
            }
            else
            {
                if (Page != null)
                {
                    return string.Format("(for {1}: {0})", Page.Type.ToString(), Page.Url);
                }
                else
                {
                    return "(undefined)";
                }
            }
        }
    }
}
