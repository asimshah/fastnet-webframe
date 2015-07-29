using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public enum FactoryName
    {
        None,
        DonWhillansHut
    }
    public abstract class CustomFactory
    {
        protected static FactoryName customisation { get; private set; }
        public CustomFactory()
        {
            string setting = ApplicationSettings.Key("Customisation:Factory", "None");
            switch (setting)
            {
                case "DonWhillansHut":
                    customisation = FactoryName.DonWhillansHut;
                    break;
                case "None":
                default:
                    customisation = FactoryName.None;
                    break;
            }
        }
    }
}
