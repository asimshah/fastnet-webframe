﻿using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Webframe.WebApi;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using CD = Fastnet.Webframe.CoreData;


namespace Fastnet.Webframe.Web.Controllers
{
    [RoutePrefix("store")]
    //[Authorize]
    [PermissionFilter("Editors")]
    public class StoreController : BaseApiController //: ApiController
    {
        private CD.CoreDataContext DataContext = CD.Core.GetDataContext();
        //private string CurrentMemberId
        //{
        //    get
        //    {
        //        if (HttpContext.Current.Session["member-id"] == null)
        //        {
        //            return null;
        //        }
        //        return (string)HttpContext.Current.Session["member-id"];
        //    }
        //}
        [HttpGet]
        [Route("directories/{id?}")]
        public Task<HttpResponseMessage> GetDirectories(long? id = null)
        {
            //var directories = null;
            if (!id.HasValue)
            {
                var rd = DataContext.Directories.Single(d => d.ParentDirectory == null);
                var data = new List<dynamic>();
                data.Add(new { Id = rd.DirectoryId, Name = "Store", SubdirectoryCount = rd.SubDirectories.Count });
                return Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, data));
            }
            var directories = DataContext.Directories.Where(d => d.ParentDirectory.DirectoryId == id.Value)
                .OrderBy(x => x.Name)
                .Select(x => new { Id = x.DirectoryId, Name = x.Name, SubdirectoryCount = x.SubDirectories.Count() });
            return Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, directories));
        }
        [HttpGet]
        [Route("content/{id}")]
        public Task<HttpResponseMessage> GetDirectoryContent(long id)
        {
            //var allPages = DataContext.Pages.Where(p => p.DirectoryId == id)
            //    .OrderBy(x => x.PageId);
            var directory = DataContext.Directories.Find(id);
            //var allPages = directory.Pages.OrderBy(x => x.PageId);
            List<dynamic> folderContent = new List<dynamic>();
            foreach (var page in directory.Pages.OrderBy(x => x.PageId))
            {
                //if (page.CentrePanelPages.Count() == 0)
                if (page.IsCentrePage)
                {
                    string remarks = page.SidePageInfo;
                    //foreach (var pp in page.SidePanelPages)
                    //{
                    //    switch (pp.Panel.Name)
                    //    {
                    //        case "BannerPanel":
                    //            remarks += "B";
                    //            break;
                    //        case "LeftPanel":
                    //            remarks += "L";
                    //            break;
                    //        case "RightPanel":
                    //            remarks += "R";
                    //            break;
                    //    }
                    //}
                    folderContent.Add(new
                    {
                        Type = "page",
                        Id = page.PageId,
                        Url = page.Url,
                        Name = page.Name,
                        Remarks = remarks,
                        LandingPage = page.IsLandingPage
                    });
                }
            }
            foreach (var image in directory.Images.OrderBy(x => x.ImageId))
            {
                folderContent.Add(new
                {
                    Type = "image",
                    Id = image.ImageId,
                    Url = image.Url,
                    Name = image.Name,
                    Size = image.Size // string.Format("{1}w x {0}h", image.Height, image.Width),
                });
            }
            foreach (var document in directory.Documents.OrderBy(x => x.DocumentId))
            {
                folderContent.Add(new
                {
                    Type = "document",
                    Id = document.DocumentId,
                    Url = document.Url,
                    Name = document.Name,
                    Remarks = string.Empty,
                });
            }
            return Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, folderContent));
        }
        [HttpPost]
        [Route("createdirectory")]
        public async Task<HttpResponseMessage> CreateNewDirectory(dynamic data)
        {
            bool result = true;
            try
            {
                long directoryId = data.directoryId;
                CD.Directory parent = DataContext.Directories.Find(directoryId);
                CD.Directory dir = new CD.Directory();
                dir.Name = GetUniqueDirectoryName(parent);
                dir.ParentDirectory = parent;
                DataContext.Directories.Add(dir);
                await DataContext.SaveChangesAsync();
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, new { DirectoryId = dir.DirectoryId, Name = dir.Name }));
            }
            catch (Exception xe)
            {
                Log.Write(xe.Message);
                result = false;
            }
            if (!result)
            {
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
        }
        [HttpPost]
        [Route("createpage/{refpageid?}")]
        public async Task<HttpResponseMessage> CreateNewPage(dynamic data, long? refpageid = null)
        {
            bool result = true;
            try
            {
                long directoryId;
                if (refpageid.HasValue)
                {
                    directoryId = DataContext.Pages.Find(refpageid.Value).Directory.DirectoryId;
                }
                else
                {
                    directoryId = data.directoryId;
                }
                CD.Page page = await CreatePageInternal(directoryId);
                //long pageId = page.PageId;
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, new { PageId = page.PageId, Url = page.Url, Name = page.Name }));
            }
            catch (Exception xe)
            {
                Log.Write(xe.Message);
                result = false;

            }
            if (!result)
            {
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
        }

        [HttpPost]
        [Route("delete")]
        public async Task<HttpResponseMessage> DeleteItem(dynamic data)
        {
            bool result = true;
            try
            {
                long id = data.id;
                switch ((string)data.type)
                {
                    case "page":
                        await DeletePage(id);
                        break;
                    case "directory":
                        await DeleteDirectory(id);
                        break;
                }
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                result = false;

            }
            if (!result)
            {
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
        }
        [HttpGet]
        [Route("get/directory/{id}")]
        public async Task<HttpResponseMessage> GetDirectoryDetails(long id)
        {
            CD.Directory d = DataContext.Directories.Find(id);
            var data = new
            {
                Id = d.DirectoryId,
                Name = d.Name
            };
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, data));
            //return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.Forbidden));
        }
        [HttpPost]
        [Route("update/directory")]
        public async Task<HttpResponseMessage> UpdateDirectory(dynamic data)
        {
            long id = data.id;
            CD.Directory d = DataContext.Directories.Find(id);
            d.Name = data.name;
            await DataContext.SaveChangesAsync();
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
        }
        [HttpGet]
        [Route("get/page/{id}")]
        public async Task<HttpResponseMessage> GetPageDetails(long id)
        {
            CD.Page p = DataContext.Pages.Find(id);
            var data = new
            {
                Id = p.PageId,
                Url = p.Url,
                Name = p.Name,
                CreatedBy = p.PageMarkup.CreatedBy,
                CreatedOn = p.PageMarkup.CreatedOn.ToString("ddMMMyyyy HH:mm"),
                ModifiedBy = p.PageMarkup.ModifiedBy,
                ModifiedOn = p.PageMarkup.ModifiedOn.HasValue ? p.PageMarkup.ModifiedOn.Value.ToString("ddMMMyyyy HH:mm") : "",
                ModificationState = p.PageMarkup.ModifiedOn.HasValue ? "visible" : "hidden"
            };
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, data));
        }
        [HttpGet]
        [Route("panelinfo/{id}")]
        public HttpResponseMessage GetSidePanelInformation(string id)
        {
            Func<CD.Page, long?> getPageId = (p) =>
                {
                    if (p == null)
                    {
                        return null;
                    }
                    else
                    {
                        return p.PageId;
                    }
                };
            Func<CD.Page, CD.Panel, CD.Page> sidePanelPage = (cp, panel) =>
            {
                CD.Page sp = null;
                if (panel.Visible)
                {
                    CD.PanelPage panelPage = cp.SidePanelPages.SingleOrDefault(pp => pp.Panel.PanelId == panel.PanelId);
                    sp = panelPage != null ? panelPage.Page : null;
                }
                return sp;
            };
            CD.Page centrePage = DataContext.Pages.Find(Int64.Parse(id));
            CD.Page bp = sidePanelPage(centrePage, CD.Panel.BannerPanel);
            CD.Page lp = sidePanelPage(centrePage, CD.Panel.LeftPanel);
            CD.Page rp = sidePanelPage(centrePage, CD.Panel.RightPanel);
            var result = new
            {
                BannerPanel = new { PageId = getPageId(bp) },
                LeftPanel = new { PageId = getPageId(lp) },
                RightPanel = new { PageId = getPageId(rp) }
            };
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpPost]
        [Route("update/page")]
        public async Task<HttpResponseMessage> UpdatePage(dynamic data)
        {
            long id = data.id;
            CD.Page p = DataContext.Pages.Find(id);
            p.Name = data.name;
            await DataContext.SaveChangesAsync();
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
        }
        [HttpPost]
        [Route("update/page/content")]
        public async Task<HttpResponseMessage> UpdatePageContent(dynamic data)
        {
            Action<dynamic> update = (p) =>
            {
                string pageId = p.PageId;
                if (pageId != null)
                {
                    bool changed = (bool)p.HasChanged;
                    if (changed)
                    {
                        long id = Convert.ToInt64(pageId);
                        string htmlText = (string)p.HtmlText;
                        CD.Page page = DataContext.Pages.Find(id);
                        CD.PageMarkup pm = page.PageMarkup;
                        pm.HtmlText = htmlText;
                        pm.HtmlTextLength = htmlText.Length;
                        pm.ModifiedBy = this.GetCurrentMember().Fullname;
                        pm.ModifiedOn = DateTime.UtcNow;
                        page.MarkupType = CD.MarkupType.Html;
                    }
                }
            };
            update((data as dynamic).BannerPanel);
            update((data as dynamic).LeftPanel);
            update((data as dynamic).CentrePanel);
            update((data as dynamic).RightPanel);
            await DataContext.SaveChangesAsync();
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
        }
        [HttpPost]
        [Route("upload/file")]
        public async Task<HttpResponseMessage> UploadFile(dynamic data)
        {
            // data properties:
            // chunkNumber: number of this chunk (zero based)
            // totalChunks: total chunks for this transfer
            // updateKey: a guid originally provided by the server - see notes
            // directoryId: directory in which to store the uploaded file
            // filename: full filename (incl extension but no path(s))
            // mimetype:
            // binaryLength: binary length once chunks are assembled and converted to byte[]
            // base64: base64 string data
            // base64Length: length of base64
            //
            // Notes:
            // 1. a new update starts with chunkNumber == 0
            //    a. this causes a new upload to start
            //    b. a guid is created that will identify subsequent uploads
            //    c. properties directoryid, filename, and mimetype, binaryLength, chunkNumber, totalChunks, base64 and base64Length are valid
            //    d. updatekey is not valid
            // 2. calls continue for each chunk
            //    a. only updateKey, chunkNumber, totalChunks, base64 and base64Length are valid
            // 3. final chunk is when chunkNumber == (totalChunks - 1)
            //    a. file is reassembled from base64 strings and saved in the required directory
            Action<CD.UploadFile, int, string> saveChunk = (uf, cn, bs) =>
            {
                CD.FileChunk fc = new CD.FileChunk
                {
                    UploadFile = uf,
                    ChunkNumber = cn,
                    //Length = len,
                    Base64String = bs
                };
                DataContext.FileChunks.Add(fc);
                DataContext.SaveChanges();
            };
            bool result = true;
            int chunkNumber = data.chunkNumber;
            long totalChunks = data.totalChunks;
            string base64String = data.base64;
            int base64StringLength = data.base64Length;
            string key = null;
            CD.UploadFile uploadFile = null;
            Debug.Assert(base64StringLength == base64String.Length);
            try
            {
                if (chunkNumber == 0)
                {
                    long directoryid = Convert.ToInt64((string)data.directoryId);
                    CD.Directory d = DataContext.Directories.Find(directoryid);
                    string filename = data.filename;
                    string mimetype = data.mimetype;
                    long binaryLength = data.binaryLength;
                    uploadFile = new CD.UploadFile
                    {
                        Name = filename,
                        MimeType = mimetype,
                        DirectoryId = directoryid,
                        Guid = Guid.NewGuid().ToString(),
                        TotalChunks = totalChunks,
                        BinaryLength = binaryLength
                    };
                    key = uploadFile.Guid;
                    DataContext.UploadFiles.Add(uploadFile);
                    //saveChunk(uploadFile, chunkNumber, base64String);
                    //return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, uploadFile.Guid));
                }
                else
                {
                    key = data.updateKey;
                    uploadFile = DataContext.UploadFiles.Single(x => x.Guid == key);
                }
                saveChunk(uploadFile, chunkNumber, base64String);
                if (chunkNumber < (totalChunks - 1))
                {
                    //return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, key));
                }
                else
                {
                    await SaveUploadedFile(uploadFile);

                }                
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                result = false;                
            }
            if (!result)
            {
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, key));
        }

        private async Task SaveUploadedFile(CD.UploadFile uploadFile)
        {
            long directoryid = uploadFile.DirectoryId;
            CD.Directory d = DataContext.Directories.Find(directoryid);

            string filename = uploadFile.Name;
            string mimetype = uploadFile.MimeType;
            long binaryLength = uploadFile.BinaryLength;
            var chunks = uploadFile.FileChunks.OrderBy(fc => fc.ChunkNumber).ToArray();
            StringBuilder sb = new StringBuilder();
            foreach (CD.FileChunk fc in chunks)
            {
                sb.Append(fc.Base64String);
            }
            string base64String = sb.ToString();
            byte[] fileData = Convert.FromBase64String(base64String);
            Debug.Assert(fileData.Length == uploadFile.BinaryLength);
            if (ApplicationSettings.Key("SaveDocumentsToDisk", false))
            {
                SaveDocumentToDisk(d.Fullpath, filename, fileData);
            }
            string url = string.Empty;
            try
            {
                switch (mimetype)
                {
                    case "image/jpeg":
                    case "image/png":
                    case "image/gif":
                        CD.Image image = CreateImage(d, filename, fileData, mimetype);
                        url = image.Url;
                        break;
                    default:
                        CD.Document document = CreateDocument(d, filename, fileData, mimetype);
                        url = document.Url;
                        break;
                }
                await DataContext.SaveChangesAsync();
                DataContext.FileChunks.RemoveRange(chunks);
                DataContext.UploadFiles.Remove(uploadFile);
                return;// await Task.FromResult(url);
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
        //
        //
        private async Task<CD.Page> CreatePageInternal(long directoryId)
        {
            CD.Member m = this.GetCurrentMember();// DataContext.Members.Find(CurrentMemberId);
            CD.Directory dir = DataContext.Directories.Find(directoryId);
            CD.Page page = DataContext.CreateNewPage();
            CD.PageMarkup pm = page.PageMarkup;
            pm.CreatedBy = m.Fullname;
            pm.CreatedOn = DateTime.UtcNow;
            pm.TimeStamp = BitConverter.GetBytes(-1);


            page.TimeStamp = BitConverter.GetBytes(-1);
            page.Visible = true;
            page.VersionCount = 0;
            page.Name = GetUniquePageName(dir);
            page.Directory = dir;
            page.MarkupType = CD.MarkupType.Html;
            page.PageMarkup = pm;
            string defaultPagesFolder = HttpContext.Current.Server.MapPath("~/Default Pages");
            string blankHtmlFile = System.IO.Path.Combine(defaultPagesFolder, "Blank Page.html");
            byte[] htmlData = System.IO.File.ReadAllBytes(blankHtmlFile);
            pm.HtmlText = Encoding.Default.GetString(htmlData);
            await DataContext.SaveChangesAsync();
            return page;
        }
        private CD.Document CreateDocument(CD.Directory d, string filename, byte[] fileData, string mimetype)
        {
            CD.Member cm = this.GetCurrentMember();// DataContext.Members.Find(CurrentMemberId);
            CD.Document document = DataContext.CreateNewDocument();
            document.CreatedBy = cm.Fullname;
            document.CreatedOn = DateTime.UtcNow;
            document.Directory = d;
            document.Data = fileData;
            document.Extension = System.IO.Path.GetExtension(filename);
            document.Length = fileData.Length;
            document.Name = filename;
            document.MimeType = mimetype;
            document.TimeStamp = BitConverter.GetBytes(-1);
            DataContext.Documents.Add(document);
            return document;
        }
        private CD.Image CreateImage(CD.Directory d, string filename, byte[] fileData, string mimetype)
        {
            CD.Member cm = this.GetCurrentMember();// DataContext.Members.Find(CurrentMemberId);
            var dimensions = GetDimensions(fileData);
            CD.Image image = DataContext.CreateNewImage();
            image.CreatedBy = cm.Fullname;
            image.CreatedOn = DateTime.UtcNow;
            image.Directory = d;
            image.Data = fileData;
            image.Height = dimensions.Height;
            image.Width = dimensions.Width;
            image.Name = filename;
            switch (mimetype)
            {
                case "image/jpeg":
                    image.ImageType = CD.ImageType.Jpeg;
                    break;
                case "image/png":
                    image.ImageType = CD.ImageType.Png;
                    break;
                case "image/gif":
                    image.ImageType = CD.ImageType.Gif;
                    break;
                default:
                    break;
            }
            image.TimeStamp = BitConverter.GetBytes(-1);
            DataContext.Images.Add(image);
            return image;
        }
        private async Task DeleteDirectory(long id)
        {
            using (var tran = DataContext.Database.BeginTransaction())
            {
                try
                {
                    CD.Directory d = DataContext.Directories.Find(id);
                    await DeleteDirectory(d);
                    tran.Commit();
                }
                catch (Exception)
                {
                    tran.Rollback();
                    //Log.Write(xe);
                    throw;
                }
            }
        }
        private async Task DeleteDirectory(CD.Directory dir)
        {
            foreach (CD.Page p in dir.Pages.ToArray())
            {
                DeletePage(p);
            }
            foreach (CD.Directory d in dir.SubDirectories.ToArray())
            {
                await DeleteDirectory(d);
            }
            DataContext.Directories.Remove(dir);
            await DataContext.SaveChangesAsync();
        }
        private async Task DeletePage(long id)
        {
            CD.Page p = DataContext.Pages.Find(id);
            DeletePage(p);
            await DataContext.SaveChangesAsync();
        }
        private void DeletePage(CD.Page p)
        {
            CD.PageMarkup pm = p.PageMarkup;
            DataContext.PageMarkups.Remove(pm);
            DataContext.Pages.Remove(p);
        }
        private string GetUniquePageName(CD.Directory dir)
        {
            string proposedName = "New Page";
            Func<string, bool> nameExists = (name) =>
            {
                return dir.Pages.FirstOrDefault(x => String.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0) != null;
            };
            string newName = proposedName;
            int index = 0;
            while (nameExists(newName))
            {
                newName = string.Format("{0} ({1})", proposedName, ++index);
            }
            return newName;
        }
        private string GetUniqueDirectoryName(CD.Directory dir)
        {
            string proposedName = "New Folder";
            Func<string, bool> nameExists = (name) =>
            {
                return dir.SubDirectories.FirstOrDefault(x => String.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0) != null;
            };
            string newName = proposedName;
            int index = 0;
            while (nameExists(newName))
            {
                newName = string.Format("{0} ({1})", proposedName, ++index);
            }
            return newName;
        }
        private dynamic GetDimensions(byte[] image)
        {
            using (var ms = new System.IO.MemoryStream(image))
            {
                var img = System.Drawing.Image.FromStream(ms);
                return new { Height = img.Height, Width = img.Width };
            }
        }
        private void SaveDocumentToDisk(string folder, string filename, byte[] data)
        {
            string rootFolder = HostingEnvironment.MapPath("~/App_Data/documents");
            string targetFolder = System.IO.Path.Combine(rootFolder, folder.Replace("/", "\\"));
            if (!System.IO.Directory.Exists(targetFolder))
            {
                System.IO.Directory.CreateDirectory(targetFolder);
            }
            string outputFile = System.IO.Path.Combine(targetFolder, filename);
            System.IO.File.WriteAllBytes(outputFile, data);
        }
    }
}
