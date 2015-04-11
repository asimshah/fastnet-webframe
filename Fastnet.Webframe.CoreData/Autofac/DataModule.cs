using Autofac;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
	public class DataModule : Module
	{
        protected override void Load(ContainerBuilder builder)
        {
            builder.Register(c => new CoreDataContext()).AsSelf().InstancePerRequest();
            //builder.Register(c => new CoreDataContext()).AsSelf().InstancePerMatchingLifetimeScope("application");
            base.Load(builder);
        }
	}
}