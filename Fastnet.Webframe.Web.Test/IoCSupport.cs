using Autofac;
using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.Web.Test
{
    //public class IoCSupport<TModule> where TModule : Module, new()
    //{
    //    private IContainer container;
    //    public IoCSupport()
    //    {
    //        var builder = new ContainerBuilder();
    //        //builder.RegisterModule(new TModule());
    //        container = builder.Build();

    //    }
    //    protected TEntity Resolve<TEntity>()
    //    {
    //        return container.Resolve<TEntity>();
    //    }
    //    protected void ShutdownIOC()
    //    {
    //        container.Dispose();
    //    }
    //}
    public class IoCSupport//<TModule> where TModule : Module, new()
    {
        private IContainer container;
        public IoCSupport()
        {
            var builder = new ContainerBuilder();
            builder.RegisterType<CoreDataContext>().SingleInstance();
            //builder.RegisterModule(new TModule());
            container = builder.Build();
            Core.SetContainer(container);
        }
        //protected TEntity Resolve<TEntity>()
        //{
        //    return container.Resolve<TEntity>();
        //}
        protected void ShutdownIOC()
        {
            container.Dispose();
        }
    }
}
