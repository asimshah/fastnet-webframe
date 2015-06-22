using Fastnet.Common;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Mvc;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.WebApi;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.SessionState;
//using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Controllers
{

    public static class Extensions
    {
        public static void SetCurrentPage(this ApiController controller, Page page)
        {
            SetPage(page);
        }
        public static void SetCurrentPage(this Controller controller, Page page)
        {
            SetPage(page);
        }
        public static Page GetCurrentPage(this ApiController controller)
        {
            return GetPage();
        }
        public static Page GetCurrentPage(this Controller controller)
        {
            return GetPage();
        }
        //public static void SetCurrentMember(this ApiController controller, Member member)
        //{
        //    SetMember(member);
        //}
        //public static void SetCurrentMember(this BaseMvcController controller, Member member)
        //{
        //    SetMember(member);
        //}
        //public static Member GetCurrentMember(this BaseApiController controller)
        //{
        //    return GetMember();
        //}
        //public static Member GetCurrentMember(this BaseMvcController controller)
        //{
        //    return GetMember();
        //}
        //private static void SetMember(Member member)
        //{
            
        //    // store the id not the object so that we are syncornised with
        //    // the current datacontext
        //    var session = HttpContext.Current.Session;
        //    session["current-member"] = member == null ? null : member.Id;
        //    //Debug.Print("Recorded member {0}", member == null ? "null" : member.Fullname);
        //}
        //private static Member GetMember()
        //{
        //    // store the id not the object so that we can synchronise with
        //    // the current datacontext
        //    var session = HttpContext.Current.Session;
        //    string id = (string)(session["current-member"] ?? null);
        //    return id == null ? Member.Anonymous : Core.GetDataContext().Members.Single(m => m.Id == id);
        //    //Debug.Print("Recorded member {0}", member.Fullname);
        //}
        private static void SetPage(Page page)
        {
            // store the id not the object so that we are syncornised with
            // the current datacontext
            var session = HttpContext.Current.Session;
            session["current-page"] = page == null ? (long?)null : (long?)page.PageId;
            //Debug.Print("Recorded page {0}", page == null ? "null" : page.PageId);
        }
        private static Page GetPage()
        {
            // store the id not the object so that we are syncornised with
            // the current datacontext
            var session = HttpContext.Current.Session;
            long? id = (long?)(session["current-page"] ?? null);
            return id.HasValue ? Core.GetDataContext().Pages.Single(m => m.PageId == id.Value) : null;
            //Debug.Print("Recorded member {0}", member.Fullname);
        }

        //public static HttpResponseMessage CreateCacheableResponse<T>(this HttpRequestMessage request, HttpStatusCode code, T value)
        //{
        //    double maxAge = ApplicationSettings.Key("Cache:MaxAge", 5.0); // in minutes
        //    HttpResponseMessage response = request.CreateResponse(code, value);
        //    CacheControlHeaderValue cchv = new CacheControlHeaderValue { Public = true, MaxAge = TimeSpan.FromMinutes(maxAge) };
        //    response.Headers.CacheControl = cchv;
        //    response.Headers.CacheControl = cchv;
        //    return response;
        //}

        //public static HttpResponseMessage CreateCacheableResponse<T>(this HttpRequestMessage request, HttpStatusCode code, T value, DateTime lastModified, params object[] etagArgs)
        //{
        //    HttpResponseMessage response = null;
        //    string etag = CreateEtag(lastModified, etagArgs);
        //    double maxAge = ApplicationSettings.Key("Cache:MaxAgeWithEtag", 0.0); // in minutes
        //    if (IsModified(request, lastModified, etag))
        //    {
               
        //        response = request.CreateResponse(code, value);
        //        response.Content.Headers.LastModified = lastModified;
        //        //response.Headers.ETag = new EntityTagHeaderValue(etag);
        //        //CacheControlHeaderValue cchv = new CacheControlHeaderValue { Public = true, MaxAge = TimeSpan.FromMinutes(maxAge) };
        //        //response.Headers.CacheControl = cchv;
        //        //return response;
        //    }
        //    else
        //    {
        //        response = request.CreateResponse(HttpStatusCode.NotModified);
        //        //return response;
        //    }
        //    //response.Content.Headers.LastModified = lastModified;
        //    response.Headers.ETag = new EntityTagHeaderValue(etag);
        //    CacheControlHeaderValue cchv = new CacheControlHeaderValue { Public = true, MaxAge = TimeSpan.FromMinutes(maxAge) };
        //    response.Headers.CacheControl = cchv;
        //    return response;           
        //}

        //public static HttpResponseMessage GetTemplate(this HttpRequestMessage request, string location, string name)
        //{
        //    System.IO.FileInfo file;
        //    var tl = TemplateLibrary.GetInstance();
        //    string text = tl.GetTemplate(location, name, out file);
        //    if (text != null)
        //    {
        //        return request.CreateCacheableResponse(HttpStatusCode.OK, new { Template = text }, file.LastWriteTime, file.FullName);
        //    }
        //    else
        //    {
        //        return request.CreateResponse(HttpStatusCode.NotFound);
        //    }
        //}

        //private static string CreateEtag(DateTime modified, params object[] args)
        //{
        //    string t = string.Format("{0:x}", modified.GetHashCode());// "";
        //    foreach (object arg in args)
        //    {
        //        if (arg != null)
        //        {
        //            t += string.Format("{0:x}", arg.GetHashCode());
        //        }
        //    }
        //    string etag = "\"" + t + "\"";
        //    return etag;
        //}
        //public static bool IsModified(this HttpRequestMessage request, DateTime lastModified, params object[] args)
        //{
        //    string etag = CreateEtag(lastModified, args);
        //    return IsModified(request, lastModified, etag);
        //}
        //private static bool IsModified(this HttpRequestMessage request, DateTime modified, string etag)
        //{
        //    var ifModifiedSince = request.Headers.IfModifiedSince;
        //    var modifiedOn = DateTime.SpecifyKind(modified.ToUniversalTime(), DateTimeKind.Utc);
        //    if (ifModifiedSince.HasValue == false || (modifiedOn - ifModifiedSince.Value) > TimeSpan.FromSeconds(1))
        //    {
        //        return true;
        //    }
        //    var ifNoneMatch = request.Headers.IfNoneMatch;
        //    var temp = ifNoneMatch.FirstOrDefault();
        //    string receivedTag = temp == null ? null : temp.Tag;            
        //    return etag != receivedTag;
        //}
    }
}