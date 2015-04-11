using Fastnet.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
//using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Controllers
{
    public static class Extensions
    {
        /// <summary>
        /// Specifies caching with MaxAge from ApplicationSettings Cache:MaxAge, default 5.0 minutes
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="request"></param>
        /// <param name="code"></param>
        /// <param name="value"></param>
        /// <returns></returns>
        public static HttpResponseMessage CreateCacheableResponse<T>(this HttpRequestMessage request, HttpStatusCode code, T value)
        {
            double maxAge = ApplicationSettings.Key("Cache:MaxAge", 5.0); // in minutes
            HttpResponseMessage response = request.CreateResponse(code, value);
            CacheControlHeaderValue cchv = new CacheControlHeaderValue { Public = true, MaxAge = TimeSpan.FromMinutes(maxAge) };
            response.Headers.CacheControl = cchv;
            response.Headers.CacheControl = cchv;
            return response;
        }
        /// <summary>
        /// Specifies caching with LastModified, Etag and MaxAge from  ApplicationSettings Cache:MaxAgeWithEtag, default 0.0 minutes
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="request"></param>
        /// <param name="code"></param>
        /// <param name="value"></param>
        /// <param name="lastModified"></param>
        /// <param name="etagArgs"></param>
        /// <returns></returns>
        public static HttpResponseMessage CreateCacheableResponse<T>(this HttpRequestMessage request, HttpStatusCode code, T value, DateTime lastModified, params object[] etagArgs)
        {
            HttpResponseMessage response = null;
            string etag = CreateEtag(lastModified, etagArgs);
            double maxAge = ApplicationSettings.Key("Cache:MaxAgeWithEtag", 0.0); // in minutes
            if (IsModified(request, lastModified, etag))
            {
               
                response = request.CreateResponse(code, value);
                response.Content.Headers.LastModified = lastModified;
                //response.Headers.ETag = new EntityTagHeaderValue(etag);
                //CacheControlHeaderValue cchv = new CacheControlHeaderValue { Public = true, MaxAge = TimeSpan.FromMinutes(maxAge) };
                //response.Headers.CacheControl = cchv;
                //return response;
            }
            else
            {
                response = request.CreateResponse(HttpStatusCode.NotModified);
                //return response;
            }
            //response.Content.Headers.LastModified = lastModified;
            response.Headers.ETag = new EntityTagHeaderValue(etag);
            CacheControlHeaderValue cchv = new CacheControlHeaderValue { Public = true, MaxAge = TimeSpan.FromMinutes(maxAge) };
            response.Headers.CacheControl = cchv;
            return response;           
        }
        private static string CreateEtag(DateTime modified, params object[] args)
        {
            string t = string.Format("{0:x}", modified.GetHashCode());// "";
            foreach (object arg in args)
            {
                if (arg != null)
                {
                    t += string.Format("{0:x}", arg.GetHashCode());
                }
            }
            string etag = "\"" + t + "\"";
            return etag;
        }
        /// <summary>
        /// Use this test how CreateCacheableResponse() will treat this request. If false, it will send HttpStatusCode.NotModified
        /// </summary>
        /// <param name="request"></param>
        /// <param name="lastModified"></param>
        /// <param name="args"></param>
        /// <returns></returns>
        public static bool IsModified(this HttpRequestMessage request, DateTime lastModified, params object[] args)
        {
            string etag = CreateEtag(lastModified, args);
            return IsModified(request, lastModified, etag);
        }
        private static bool IsModified(this HttpRequestMessage request, DateTime modified, string etag)
        {
            var ifModifiedSince = request.Headers.IfModifiedSince;
            var modifiedOn = DateTime.SpecifyKind(modified.ToUniversalTime(), DateTimeKind.Utc);
            if (ifModifiedSince.HasValue == false || (modifiedOn - ifModifiedSince.Value) > TimeSpan.FromSeconds(1))
            {
                return true;
            }
            var ifNoneMatch = request.Headers.IfNoneMatch;
            var temp = ifNoneMatch.FirstOrDefault();
            string receivedTag = temp == null ? null : temp.Tag;            
            return etag != receivedTag;
        }
    }
}