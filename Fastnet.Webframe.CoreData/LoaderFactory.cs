﻿using Fastnet.EventSystem;
using Fastnet.Web.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public abstract class LoaderFactory : CustomFactory, IDisposable
    {
        protected CoreDataContext coreDb;
        protected string LegacyConnectionString { get; set; }
        //public string LegacyBookingConnectionString { get; set; }
        //public bool DataLoad { get; set; }
        protected LoaderFactory(CoreDataContext context)
        {
            coreDb = context;
            //if (FactoryName != FactoryName.None)
            //{
            //    LegacyConnectionString = GetLegacyConnectionString();
                
            //    DataLoad = Settings.legacy?.dataload ?? false;
            //}
            //else
            //{
            //    DataLoad = false;
            //}
        }
        public static LoaderFactory Get(CoreDataContext context)
        {
            bool? dataloadRequired = Settings.legacy?.dataload;
            if(dataloadRequired == true)
            {
                switch(FactoryName)
                {
                    case FactoryName.DonWhillansHut:
                        return new DWHLegacyLoader(context);
                    default:
                        throw new ApplicationException(string.Format("Factory {0}: dataload specified but no load factory exists", FactoryName.ToString()));
                }
            }
            return null;
        }
        protected string GetLegacyConnectionString()
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
        public abstract void Dispose();
        public abstract void Load();
    }
}
