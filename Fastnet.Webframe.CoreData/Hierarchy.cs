using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    public abstract class Hierarchy<T> where T : Hierarchy<T>
    {
        public abstract T GetParent();
        public IEnumerable<T> SelfAndParents
        {
            get
            {
                for (var p = this; p != null; p = p.GetParent())
                {
                    yield return (T)p;
                }
            }
        }
        public IEnumerable<T> Parents
        {
            get
            {
                for (var p = GetParent(); p != null; p = p.GetParent())
                {
                    yield return (T)p;
                }
            }
        }
    }
}
