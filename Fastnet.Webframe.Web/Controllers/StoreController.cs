using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Webframe.WebApi;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Dynamic;
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
    [Flags]
    public enum ContentFilter
    {
        SidePages = 1,
        CentrePages = 2,
        Documents = 4,
        Images = 8,
        All = 15 // all the above
    }
    [RoutePrefix("store")]
    //[PermissionFilter(CD.SystemGroups.Editors)]
    public class StoreController : BaseApiController //: ApiController
    {
        private CD.CoreDataContext DataContext = CD.Core.GetDataContext();
        [HttpGet]
        [Route("directories/{id?}")]
        public Task<HttpResponseMessage> GetDirectories(long? id = null)
        {
            //var directories = null;
            try
            {
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
            catch (Exception xe)
            {
                Log.Write(xe.Message);
                //result = false;

            }
            return Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
        }
        [HttpGet]
        [Route("content/{id}/{filter?}")]
        public Task<HttpResponseMessage> GetDirectoryContent(long id, ContentFilter filter = ContentFilter.All)
        {
            Func<CD.PageType, bool> isSidePage = (t) =>
            {
                switch (t)
                {
                    case CD.PageType.Centre:
                        return false;
                    default:
                        return true;
                }
            };
            try
            {
                var directory = DataContext.Directories.Find(id);
                List<dynamic> folderContent = new List<dynamic>();
                foreach (var page in directory.Pages.OrderBy(x => x.PageId))
                {
                    if (filter.HasFlag(ContentFilter.CentrePages) && page.Type == CD.PageType.Centre
                        || filter.HasFlag(ContentFilter.SidePages) && isSidePage(page.Type))
                    {
                        folderContent.Add(new
                        {
                            Type = "page",
                            Id = page.PageId,
                            Url = page.Url,
                            Name = page.Name,
                            PageType = page.Type.ToString().ToLower(),
                            LandingPage = page.IsLandingPage,
                            LandingPageImage = CD.Page.GetLandingPageImageUrl(),
                            PageTypeImage = page.GetTypeImageUrl(),
                            PageTypeTooltip = page.GetTypeTooltip()
                        });
                    }
                }
                foreach (var image in directory.Images.OrderBy(x => x.ImageId))
                {
                    if (filter.HasFlag(ContentFilter.Images))
                    {
                        folderContent.Add(new
                        {
                            Type = "image",
                            Id = image.ImageId,
                            Url = image.Url,
                            Name = image.Name,
                            Size = image.Size,
                            ImageTypeImage = image.GetImageTypeImage()
                        });
                    }
                }
                foreach (var document in directory.Documents.OrderBy(x => x.DocumentId))
                {
                    if (filter.HasFlag(ContentFilter.Documents))
                    {
                        folderContent.Add(new
                        {
                            Type = "document",
                            Id = document.DocumentId,
                            Url = document.Url,
                            Name = document.Name,
                            DocumentTypeImage = document.GetTypeImageUrl()
                        });
                    }
                }
                return Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, folderContent));
            }
            catch (Exception xe)
            {
                Log.Write(xe.Message);
                //result = false;

            }
            return  Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
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
                dir.RecordChanges(this.GetCurrentMember().Fullname, CD.FolderAction.EditingActionTypes.NewFolder);
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
        [Route("createpage")]
        public async Task<HttpResponseMessage> CreateNewPage(dynamic data)
        {
            try
            {
                long directoryId;
                long? refpageid = data.referencePageId;
                string pt = data.type;
                CD.PageType type = (CD.PageType)Enum.Parse(typeof(CD.PageType), pt, true);
                if (refpageid.HasValue)
                {
                    directoryId = DataContext.Pages.Find(refpageid.Value).Directory.DirectoryId;
                }
                else
                {
                    directoryId = data.directoryId;
                }
                CD.Page page = await CreatePageInternal(directoryId, type);
                page.RecordChanges(this.GetCurrentMember().Fullname, CD.PageAction.EditingActionTypes.NewPage);
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, new { PageId = page.PageId, Url = page.Url, Name = page.Name }));
            }
            catch (Exception xe)
            {
                Log.Write(xe.Message);
                //result = false;

            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
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
                    case "document":
                        await DeleteDocument(id);
                        break;
                    case "image":
                        await DeleteImage(id);
                        break;
                    default:
                        Log.Write($"Delete request for type {(string)data.type}, id {id} - not implemented");
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
            try
            {
                CD.Directory d = DataContext.Directories.Find(id);
                var data = new
                {
                    Id = d.DirectoryId,
                    Name = d.Name,
                    InheritedRestrictions = d.GetClosestDirectoryGroups().Select(dg => new
                    {
                        Group = dg.Group.GetClientSideGroupDetails(),
                        View = dg.ViewAllowed,
                        Edit = dg.EditAllowed,
                        AccessDescription = dg.GetAccessDescription()
                    }),
                    DirectRestrictions = d.DirectoryGroups.Select(dg => new
                    {
                        Group = dg.Group.GetClientSideGroupDetails(),
                        View = dg.ViewAllowed,
                        Edit = dg.EditAllowed,
                        AccessDescription = dg.GetAccessDescription()
                    }),
                    Groups = d.DirectoryGroups.Select(x => x.Group.GetClientSideGroupDetails())
                };
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, data));
            }
            catch (Exception xe)
            {
                Log.Write(xe.Message);
                //result = false;

            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
        }
        [HttpGet]
        [Route("get/directory/groups/{id}")]
        public async Task<HttpResponseMessage> GetRestrictingGroups(long id)
        {
            try
            {
                //Func<dynamic> getRestrictionInfo
                CD.Directory d = DataContext.Directories.Find(id);
                // first find the first parent directory with any group restrictions
                // then for each group restriction find all children (as a flat list)
                var currentRestrictions = d.DirectoryGroups.ToArray();
                var groups = d.GetClosestDirectoryGroups().Select(dg => dg.Group);
                List<CD.Group> list = new List<CD.Group>();
                foreach (var group in groups)
                {
                    //list.AddRange(group.GetAllChildren());
                    list.AddRange(group.Descendants);
                }
                var result = new List<dynamic>();
                foreach (var group in list.Where(g => g.GroupId != CD.Group.Anonymous.GroupId))
                {
                    dynamic item = new ExpandoObject();
                    item.Group = group.GetClientSideGroupDetails();
                    bool selected = currentRestrictions.Select(cr => cr.Group).Contains(group);
                    bool view = false;
                    bool edit = false;
                    if (selected)
                    {
                        var dg = currentRestrictions.Single(x => x.Group == group);
                        view = dg.ViewAllowed;
                        edit = dg.EditAllowed;
                    }
                    item.Parent = group.ParentGroup.GetClientSideGroupDetails();
                    item.Selected = selected;
                    item.View = view;
                    item.Edit = edit;
                    result.Add(item);
                }
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, result));
            }
            catch (Exception xe)
            {
                Log.Write(xe.Message);
                //result = false;

            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
        }
        [HttpPost]
        [Route("update/directory/groups")]
        public async Task<HttpResponseMessage> UpdateRestrictingGroups(dynamic data)
        {
            try
            {
                long directoryId = data.directoryId;
                JArray list = data.groups;
                dynamic[] items = list.ToObject<dynamic[]>();
                CD.Directory directory = await DataContext.Directories.FindAsync(directoryId);
                foreach (dynamic item in items)
                {
                    long groupId = item.groupId;
                    bool isChecked = item.isChecked;
                    bool view = item.view;
                    bool edit = item.edit;
                    Log.Debug("UpdateRestrictingGroups(): directory {0}, group id {1}", directory.Name, groupId);
                    if (isChecked)
                    {
                        bool isNew = false;
                        var dg = directory.DirectoryGroups.SingleOrDefault(x => x.Group.GroupId == groupId);
                        if (dg == null)
                        {
                            isNew = true;
                            CD.Group group = await DataContext.Groups.FindAsync(groupId);
                            dg = new CD.DirectoryGroup { Directory = directory, Group = group };
                            DataContext.DirectoryGroups.Add(dg);
                            Log.Debug("New dg created: directory {0}, group {1}", directory.Name, group.Name);
                        }
                        dg.SetView(true);
                        dg.SetEdit(edit);
                        Log.Debug("dg modified: directory {0}, group {1}, edit = {2}", dg.Directory.Name, dg.Group.Name, edit);
                        dg.RecordChanges(this.GetCurrentMember().Fullname, isNew ? CD.RestrictionAction.EditingActionTypes.RestrictionAdded : CD.EditingAction.EditingActionTypes.RestrictionModified);
                    }
                    else
                    {
                        var dg = directory.DirectoryGroups.SingleOrDefault(x => x.Group.GroupId == groupId);
                        if (dg != null)
                        {
                            Log.Debug("dg removed: directory {0}, group {1}", dg.Directory.Name, dg.Group.Name);
                            dg.RecordChanges(this.GetCurrentMember().Fullname, CD.RestrictionAction.EditingActionTypes.RestrictionRemoved);
                            DataContext.DirectoryGroups.Remove(dg);
                        }
                    }
                }
                await DataContext.SaveChangesAsync();
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
            }
            catch (Exception xe)
            {
                //Debugger.Break();
                Log.Write(xe);

            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
        }
        [HttpPost]
        [Route("update/directory")]
        public async Task<HttpResponseMessage> UpdateDirectory(dynamic data)
        {
            try
            {
                long id = data.id;
                CD.Directory d = DataContext.Directories.Find(id);
                d.Name = data.name;
                d.RecordChanges(this.GetCurrentMember().Fullname, CD.FolderAction.EditingActionTypes.FolderModified);
                await DataContext.SaveChangesAsync();
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
            }
            catch (Exception xe)
            {
                //Debugger.Break();
                Log.Write(xe);

            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
        }
        [HttpGet]
        [Route("get/page/{id}")]
        public async Task<HttpResponseMessage> GetPageDetails(long id)
        {
            try
            {
                CD.Page p = DataContext.Pages.Find(id);
                var data = new
                {
                    Id = p.PageId,
                    Url = p.Url,
                    Name = p.Name,
                    IsLandingPage = p.IsLandingPage,
                    LandingPageLocked = p.Directory.ParentDirectory == null && p.IsLandingPage,
                    LandingPageImage = CD.Page.GetLandingPageImageUrl(),
                    CreatedBy = p.PageMarkup.CreatedBy,
                    CreatedOn = p.PageMarkup.CreatedOn.ToString("ddMMMyyyy HH:mm"),
                    ModifiedBy = p.PageMarkup.ModifiedBy,
                    ModifiedOn = p.PageMarkup.ModifiedOn.HasValue ? p.PageMarkup.ModifiedOn.Value.ToString("ddMMMyyyy HH:mm") : "",
                    ModificationState = p.PageMarkup.ModifiedOn.HasValue ? "visible" : "hidden"
                };
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, data));
            }
            catch (Exception xe)
            {
                Log.Write(xe);
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
        }
        [HttpGet]
        [Route("sidepages/{id}")]
        public HttpResponseMessage GetSidePages(string id)
        {
            try
            {
                CD.Page centrePage = DataContext.Pages.Find(Int64.Parse(id));
                var Banner = centrePage.FindSidePage(CD.PageType.Banner, false);
                var Left = centrePage.FindSidePage(CD.PageType.Left, false);
                var Right = centrePage.FindSidePage(CD.PageType.Right, false);
                if (ApplicationSettings.Key("TraceSidePages", false))
                {
                    Log.Write("StoreController::GetSidePages(): centre {0}, banner {1}, left {2}, right {3}", centrePage.Url,
                        Banner == null ? "none" : Banner.Url,
                        Left == null ? "none" : Left.Url,
                        Right == null ? "none" : Right.Url);
                }

                var b = Banner == null ? default(long?) : Banner.PageId;
                var l = Left == null ? default(long?) : Left.PageId;
                var r = Right == null ? default(long?) : Right.PageId;
                var result = new { Banner = b, Left = l, Right = r };
                return this.Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception xe)
            {
                Log.Write(xe);
            }
            return this.Request.CreateResponse(HttpStatusCode.InternalServerError);
        }
        [HttpPost]
        [Route("update/page")]
        public async Task<HttpResponseMessage> UpdatePage(dynamic data)
        {
            try
            {
                long id = data.id;
                bool isLandingPage = data.isLandingPage;
                CD.Page p = DataContext.Pages.Find(id);
                p.Name = data.name;
                if (isLandingPage && !p.IsLandingPage)
                {
                    // we are making this page the landing page
                    var otherPages = p.Directory.Pages.Where(x => x.PageId != p.PageId);
                    var previousLandingPage = otherPages.SingleOrDefault(x => x.IsLandingPage);
                    if (previousLandingPage != null)
                    {
                        previousLandingPage.IsLandingPage = false;
                        previousLandingPage.RecordChanges(this.GetCurrentMember().Fullname, CD.EditingAction.EditingActionTypes.PageModified);
                    }
                    p.IsLandingPage = true;
                }
                else
                {
                    if (p.Directory.ParentDirectory == null)
                    {
                        // we cannot remove the landing page in the root directory
                        // (we can replace it)
                    }
                    else
                    {
                        p.IsLandingPage = false;
                    }
                }
                p.RecordChanges(this.GetCurrentMember().Fullname, CD.PageAction.EditingActionTypes.PageModified);
                await DataContext.SaveChangesAsync();
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
            }
            catch (Exception xe)
            {
                Log.Write(xe);
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
        }
        [HttpPost]
        [Route("update/page/content")]
        public async Task<HttpResponseMessage> UpdatePageContent(dynamic data)
        {
            try
            {
                dynamic banner = data.banner;
                dynamic left = data.left;
                dynamic centre = data.centre;
                dynamic right = data.right;

                Action<dynamic> update = (pd) =>
                {
                    bool hasChanges = pd.hasChanges;
                    if (hasChanges)
                    {
                        string pageId = pd.id;
                        long id = Convert.ToInt64(pageId);
                        string htmlText = (string)pd.html;
                        CD.Page page = DataContext.Pages.Find(id);
                        CD.PageMarkup pm = page.PageMarkup;
                        pm.HtmlText = htmlText;
                        pm.HtmlTextLength = htmlText.Length;
                        pm.ModifiedBy = this.GetCurrentMember().Fullname;
                        pm.ModifiedOn = DateTime.UtcNow;
                        page.MarkupType = CD.MarkupType.Html;
                        page.RecordChanges(this.GetCurrentMember().Fullname, CD.PageAction.EditingActionTypes.PageContentModified);
                    }
                };
                update(banner);
                update(left);
                update(centre);
                update(right);
                await DataContext.SaveChangesAsync();
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
            }
            catch (Exception xe)
            {
                Log.Write(xe);
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
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
            bool traceUpload = ApplicationSettings.Key("TraceFileUploads", false);
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
                if (traceUpload)
                {
                    Log.Write("Upload[{0}]: chunk {1} of {2}", uf.UploadFileId, uf.Name, fc.ChunkNumber + 1, uf.TotalChunks);
                }
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
                    if (traceUpload)
                    {
                        Log.Write("Upload[{0}]: {1} to {2}, {3} bytes in {4} chunks", uploadFile.UploadFileId, uploadFile.Name, d.DisplayName, binaryLength, totalChunks);
                    }
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
                    if (traceUpload)
                    {
                        Log.Write("Upload[{0}]: {1} saved", uploadFile.UploadFileId, uploadFile.Name);
                    }
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
        //
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
            if (ApplicationSettings.Key("SaveUploadsToDisk", false))
            {
                SaveUploadToDisk(d.FullName, filename, fileData);
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
        private async Task<CD.Page> CreatePageInternal(long directoryId, CD.PageType type)
        {
            var m = this.GetCurrentMember();// DataContext.Members.Find(CurrentMemberId);
            CD.Directory dir = DataContext.Directories.Find(directoryId);
            CD.Page page = DataContext.CreateNewPage();
            CD.PageMarkup pm = page.PageMarkup;
            pm.CreatedBy = m.Fullname;
            pm.CreatedOn = DateTime.UtcNow;
            pm.TimeStamp = BitConverter.GetBytes(-1);


            //page.TimeStamp = BitConverter.GetBytes(-1);
            //page.Visible = true;
            //page.VersionCount = 0;
            page.Type = type;
            page.Name = GetUniquePageName(dir, type);
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
            var cm = this.GetCurrentMember();// DataContext.Members.Find(CurrentMemberId);
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
            var cm = this.GetCurrentMember();// DataContext.Members.Find(CurrentMemberId);
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
            dir.RecordChanges(this.GetCurrentMember().Fullname, CD.FolderAction.EditingActionTypes.FolderDeleted);
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
        private async Task DeleteImage(long id)
        {
            CD.Image image = DataContext.Images.Find(id);;
            DataContext.Images.Remove(image);
            await DataContext.SaveChangesAsync();
        }
        private async Task DeleteDocument(long id)
        {
            CD.Document doc = DataContext.Documents.Find(id);
            var pages = doc.Pages.ToArray();
            doc.Pages.Clear();
            DataContext.Documents.Remove(doc);
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
            p.RecordChanges(this.GetCurrentMember().Fullname, CD.PageAction.EditingActionTypes.PageDeleted);
            CD.PageMarkup pm = p.PageMarkup;
            DataContext.PageMarkups.Remove(pm);
            DataContext.Pages.Remove(p);
        }
        private string GetUniquePageName(CD.Directory dir, CD.PageType type)
        {
            string proposedName = "New Page";
            switch (type)
            {
                case CD.PageType.Centre:
                    break;
                case CD.PageType.Banner:
                    proposedName = "Banner";
                    break;
                case CD.PageType.Left:
                    proposedName = "Left Panel";
                    break;
                case CD.PageType.Right:
                    proposedName = "Right Panel";
                    break;
            }
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
        private void SaveUploadToDisk(string folder, string filename, byte[] data)
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
