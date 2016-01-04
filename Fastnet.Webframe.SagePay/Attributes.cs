using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.SagePay
{
    [AttributeUsage(AttributeTargets.Property)]
    public class OptionalAttribute : Attribute
    {
    }
    [AttributeUsage(AttributeTargets.Property)]
    public class FormatAttribute : Attribute
    {
        public string Format { get; private set; }

        public FormatAttribute(string format)
        {
            Format = format;
        }
    }
    [AttributeUsage(AttributeTargets.Property)]
    public class UnencodedAttribute : Attribute
    {
    }
}
