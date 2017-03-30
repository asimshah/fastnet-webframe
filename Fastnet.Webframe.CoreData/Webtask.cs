using Fastnet.EventSystem;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Common;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace Fastnet.Webframe.CoreData
{
    public enum TaskStatus
    {
        NotRunning,
        Running
    }
    public class Webtask
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
        [MaxLength(128)]
        public string Id { get; set; }
        //[MaxLength(128)]
        //public string Name { get; set; }
        public TaskStatus Status { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime FinishedAt { get; set; }
    }
    public class WebtaskResult
    {
        public bool IsRunning { get; set; }
        public bool HasFailed { get; set; }
        public Exception Exception { get; set; }
        public object User { get; set; }
    }
    public abstract class TaskBase
    {
        private string tid;
        public TaskBase(string taskId)
        {
            this.tid = taskId;
        }
        public void StartAndForget(bool longRunning = false)
        {
            if (longRunning)
            {
                Task.Factory.StartNew(Start, TaskCreationOptions.LongRunning).ConfigureAwait(false);
            }
            else
            {
                Task.Run(Start).ConfigureAwait(false);
            }
        }
        public async Task<WebtaskResult> Start()
        {
            bool canExecute = CanExecute();
            if (canExecute)
            {
                //Log.Write("Task {0} started", this.GetType().Name);
                try
                {
                    WebtaskResult r = await Execute();
                    return r;
                }
                catch (Exception xe)
                {
                    Log.Write(xe);
                    throw;
                }
                finally
                {
                    Finish();
                }
                
            } else
            {
                Log.Write("Task {0} already running", this.GetType().Name);
                return new WebtaskResult { IsRunning = true };
            }
        }
        protected abstract Task<WebtaskResult> Execute();
        private bool CanExecute()
        {
            bool canExecute = false;
            using (var dc = new CoreDataContext())
            {
                //CoreDataContext dc = Core.GetDataContext();
                var tran = dc.Database.BeginTransaction();
                var isRunning = dc.IsTaskRunning(tid);
                if (!isRunning)
                {
                    canExecute = dc.StartTask(tid);
                    dc.SaveChanges();
                    //canExecute = true;
                }
                tran.Commit();
            }
            return canExecute;
        }
        private void Finish()
        {
            using (var dc = new CoreDataContext())
            {
                //CoreDataContext dc = Core.GetDataContext();
                var tran = dc.Database.BeginTransaction();
                dc.FinishTask(tid);
                dc.SaveChanges();
                tran.Commit();
            }
        }
    }
    public partial class CoreDataContext
    {
        private Webtask CreateTask(string taskId)
        {
            var t = new Webtask { Id = taskId };
            Webtasks.Add(t);
            SaveChanges();
            return t;
        }
        public bool FinishTask(string taskId)
        {
            try
            {
                //Database.UseTransaction(tran);
                var t = this.Webtasks.SingleOrDefault(x => x.Id == taskId);
                if (t == null)
                {
                    return false;
                }
                if (t.Status == TaskStatus.Running)
                {
                    t.Status = TaskStatus.NotRunning;
                    t.FinishedAt = DateTime.UtcNow;
                }
                else
                {
                    return false;
                }
                //tran?.Commit();
                return true;
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
        public bool StartTask(string taskId)
        {
            try
            {
                //Database.UseTransaction(tran);
                var t = this.Webtasks.SingleOrDefault(x => x.Id == taskId);
                if (t == null)
                {
                    t = CreateTask(taskId);

                }
                if (t.Status == TaskStatus.NotRunning)
                {
                    t.Status = TaskStatus.Running;
                    t.StartedAt = DateTime.UtcNow;
                    t.FinishedAt = DateTime.MinValue;
                }
                else
                {
                    return false;
                }
                //tran?.Commit();
                return true;
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
        public bool IsTaskRunning(string taskId)
        {
            try
            {
                //Database.UseTransaction(tran);
                var t = this.Webtasks.SingleOrDefault(x => x.Id == taskId);
                if (t == null)
                {
                    t = CreateTask(taskId);
                    //tran?.Commit();
                }
                return t.Status == TaskStatus.Running;
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
        public void ResetAllTasks()
        {
            var time = DateTime.UtcNow;
            var tasks = Webtasks.Where(x => x.Status == TaskStatus.Running);
            foreach (var t in tasks)
            {
                t.Status = TaskStatus.NotRunning;
                t.FinishedAt = time;
            }
            SaveChanges();
        }
    }
}

