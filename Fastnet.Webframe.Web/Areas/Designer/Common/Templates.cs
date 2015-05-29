using Fastnet.Webframe.Web.Common;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Hosting;

namespace Fastnet.Webframe.Web.Areas.Designer.Common
{
    //public class DesignerFormTemplate : TemplateBase
    //{
    //    private enum designerFormTypes
    //    {
    //        LayoutHome,
    //        LayoutCSSEditor
    //    }
    //    private designerFormTypes type;
    //    public static readonly DesignerFormTemplate LayoutHome = new DesignerFormTemplate(designerFormTypes.LayoutHome);
    //    public static readonly DesignerFormTemplate LayoutCSSEditor = new DesignerFormTemplate(designerFormTypes.LayoutCSSEditor);
    //    private DesignerFormTemplate(designerFormTypes type)
    //    {
    //        templateFolder = HostingEnvironment.MapPath("~/Areas/Designer/Templates");
    //        this.type = type;

    //    }
    //    protected override string GetRootFolder()
    //    {
    //        return Path.Combine(templateFolder, "Forms");
    //    }
    //    protected override string GetTemplateFilename()
    //    {
    //        return string.Format("{0}.html", type.ToString());
    //    }
    //    public static DesignerFormTemplate FromString(string type)
    //    {
    //        designerFormTypes ft = (designerFormTypes)Enum.Parse(typeof(designerFormTypes), type, true);
    //        switch (ft)
    //        {
    //            case designerFormTypes.LayoutHome:
    //                return LayoutHome;
    //            case designerFormTypes.LayoutCSSEditor:
    //                return LayoutCSSEditor;
    //        }
    //        throw new ArgumentOutOfRangeException("type");
    //    }
    //    public override string ToString()
    //    {
    //        return type.ToString().ToLower();
    //    }
    //}

}