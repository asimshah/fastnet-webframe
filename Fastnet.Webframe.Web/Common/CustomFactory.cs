using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.Web.Common
{
    public enum Customisation
    {
        None,
        DonWhillansHut
    }
    public abstract class CustomFactory
    {
        protected static Customisation customisation { get; private set; }
        public CustomFactory()
        {
            string setting = ApplicationSettings.Key("CustomFactory", "None");
            switch (setting)
            {
                case "DonWhillansHut":
                    customisation = Customisation.DonWhillansHut;
                    break;
                case "None":
                default:
                    customisation = Customisation.None;
                    break;
            }
        }
    }
}
