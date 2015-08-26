using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{
    //public abstract class Hierarchy<T> where T : Hierarchy<T>
    //{
    //    internal abstract T GetParent();
    //    internal abstract IEnumerable<T> GetChildren();
    //    public IEnumerable<T> SelfAndParents
    //    {
    //        get
    //        {
    //            for (var p = this; p != null; p = p.GetParent())
    //            {
    //                yield return (T)p;
    //            }
    //        }
    //    }
    //    public IEnumerable<T> Parents
    //    {
    //        get
    //        {
    //            T start = GetParent();
    //            if (start == null)
    //            {
    //                yield break;
    //            }
    //            for (var p = GetParent(); p != null; p = p.GetParent())
    //            {
    //                yield return (T)p;
    //            }

    //        }
    //    }
    //    public IEnumerable<T> GetAllChildren()
    //    {
    //        return Descendants;
    //        //foreach (T child in this.GetChildren())
    //        //{
    //        //    yield return child;
    //        //    foreach (T nc in child.GetAllChildren())
    //        //    {
    //        //        yield return nc;
    //        //    }
    //        //}
    //    }
    //    public IEnumerable<T> Descendants
    //    {
    //        get
    //        {
    //            foreach (T child in this.GetChildren())
    //            {
    //                yield return child;
    //                foreach (T nc in child.Descendants)
    //                {
    //                    yield return nc;
    //                }
    //            }
    //        }
    //    }
    //    public IEnumerable<T> SelfAndDescendants
    //    {
    //        get
    //        {
    //            yield return this as T;
    //            foreach (T child in this.Descendants)
    //            {
    //                yield return child;
    //            }
    //        }
    //    }
    //}
}
