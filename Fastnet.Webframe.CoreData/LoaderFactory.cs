using Fastnet.EventSystem;
using Fastnet.Web.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public class LoaderFactory : CustomFactory
    {
        public string LegacyConnectionString { get; set; }
        public bool DataLoad { get; set; }
        public LoaderFactory()
        {
            if (FactoryName != FactoryName.None)
            {
                LegacyConnectionString = GetLegacyConnectionString();
                DataLoad = Settings.legacy?.dataload ?? false;
            }
            else
            {
                DataLoad = false;
            }
        }
        private string GetLegacyConnectionString()
        {
            try
            {
                if (FactoryName == FactoryName.DonWhillansHut)
                {
                    string cs = Settings.legacy.connectionStringName;
                    if (string.IsNullOrWhiteSpace(cs))
                    {
                        throw new ApplicationException("No legacy connection string defined");
                    }
                    else
                    {
                        return cs;
                    }
                }
                else
                {
                    throw new ApplicationException("data load not supported for this factory");
                }
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
    }
}
