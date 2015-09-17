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
        protected LoaderFactory(CoreDataContext context)
        {
            coreDb = context;
        }
        public static LoaderFactory Get(CoreDataContext context)
        {
            bool? dataloadRequired = false;
            //bool? dataloadRequired = Settings.legacy?.dataload;
            switch (FactoryName)
            {
                case FactoryName.DonWhillansHut:
                    dataloadRequired = Settings?.legacy?.dataload ?? false;
                    if (dataloadRequired == true)
                    {
                        return new DWHLegacyLoader(context);
                    }
                    break;
                default:
                    break;
            }
            return null;
        }
        protected string GetLegacyConnectionString()
        {
            try
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
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
        public abstract void Dispose();
        public abstract Task Load();
    }
}
