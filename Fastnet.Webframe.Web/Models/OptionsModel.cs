using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Models
{
    public class OptionsModel : ViewModelBase
    {
        public int MinimumPasswordLength { get; private set; }
        public bool RequireComplexPassword { get; private set; }
        public OptionsModel()
        {
            MinimumPasswordLength = ApplicationSettings.Key("MinimumPasswordLength", 8);
            RequireComplexPassword = ApplicationSettings.Key("RequireComplexPassword", false);
        }
    }
}