using Autofac;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    [Obsolete]
	public class DataModuleOld : Module
	{
        protected override void Load(ContainerBuilder builder)
        {
            builder.Register(c => new CoreDataContext()).AsSelf().InstancePerRequest();
            
            //builder.Register(c => new CoreDataContext()).AsSelf().InstancePerMatchingLifetimeScope("application");
            base.Load(builder);
        }
	}
}