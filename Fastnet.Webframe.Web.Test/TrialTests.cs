using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.CoreData;
using System.Diagnostics;
using Fastnet.Webframe.Web.Areas.membership.Controllers;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;

namespace Fastnet.Webframe.Web.Test
{
    [TestClass]
    public class TrialTests : IoCSupport//<DataModule>
    {
        private CoreDataContext ctx;
        [TestInitialize]
        public void Setup()
        {
            this.ctx = Core.GetDataContext();
        }
        [TestCleanup]
        public void TearDown()
        {
            ctx = null;
            ShutdownIOC();
        }
        [TestMethod]
        public async Task FirstTest()
        {
            var controller = new MembershipController();
            IEnumerable<dynamic> allMembers = await controller.GetAllMembers();
            //Debug.Print("first test");
            Assert.IsTrue(allMembers.Count(x => x.IsAdministrator) == 1);
            //return null;
        }
    }
}
