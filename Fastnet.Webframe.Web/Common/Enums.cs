using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.Web.Common
{
    [Flags]
    public enum Features
    {
        DateCapture = 1,
        SomethingElse = 64
    }
    // Client Dialogs are not the same as FormTypes!!
    // FormTypes specify and individual form that has a corresponding
    // html template.
    // Client dialog are a means of telling the page system
    // that a dialog needs to be shown and which one. Of course, this leads to a request to load
    // form template of one of the FormTypes.
    // There are some FormTypes that are loaded from another formType and
    // the page system does not itself show such a form.
    //
    // [Could this be simplified? and should it?]
    public enum ClientSideActions
    {
        register,
        login,
        activationsuccessful,
        activationfailed,
        userprofile,
        passwordreset,
        passwordresetfailed,
        changepassword,
        enabledit
    }
}