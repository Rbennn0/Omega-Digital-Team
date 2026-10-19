// storage.js - Person 2
// Saves and loads repair jobs in the browser (localStorage).
// Other files call these functions: loadJobs, getJob, createJob, addProgress, completeJob.

var JOBS_KEY = "meadowHouseJobs";
var COUNTER_KEY = "meadowHouseCounter";

// ---------- Saving and loading ----------

// Returns the list of all saved jobs. If nothing is saved (or the data is broken), returns an empty list.
function loadJobs() {
  try {
    var text = localStorage.getItem(JOBS_KEY);
    if (!text) {
      return [];
    }
    var jobs = JSON.parse(text);
    if (Array.isArray(jobs)) {
      return jobs;
    }
    return [];
  } catch (error) {
    return [];
  }
}

// Saves the whole list of jobs. (Only used inside this file.)
function saveJobs(jobs) {
  try {
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  } catch (error) {
    throw new Error("Could not save. Browser storage may be full or blocked.");
  }
}

// ---------- Unique IDs ----------

// Gives the next ID: MH-0001, MH-0002, ...
// Uses a separate saved counter so IDs stay unique even after a refresh.
function nextId() {
  var counter = 0;
  try {
    counter = parseInt(localStorage.getItem(COUNTER_KEY), 10);
  } catch (error) {
    counter = 0;
  }
  if (isNaN(counter)) {
    counter = 0;
  }

  // Safety: never reuse an ID that already exists in the saved jobs.
  var jobs = loadJobs();
  for (var i = 0; i < jobs.length; i++) {
    var num = parseInt(String(jobs[i].id).replace("MH-", ""), 10);
    if (!isNaN(num) && num > counter) {
      counter = num;
    }
  }

  counter = counter + 1;
  try {
    localStorage.setItem(COUNTER_KEY, String(counter));
  } catch (error) {
    // If this fails, the safety check above still keeps IDs unique.
  }

  var digits = String(counter);
  while (digits.length < 4) {
    digits = "0" + digits;
  }
  return "MH-" + digits;
}

// ---------- Finding one job ----------

// Returns the job with this ID, or null if there isn't one.
function getJob(id) {
  var jobs = loadJobs();
  for (var i = 0; i < jobs.length; i++) {
    if (jobs[i].id === id) {
      return jobs[i];
    }
  }
  return null;
}

// ---------- Creating a job ----------

// data = { description, reporter, priority }
// Returns the new job.
function createJob(data) {
  var description = String((data && data.description) || "").trim();
  var reporter = String((data && data.reporter) || "").trim();
  var priority = data && data.priority === "Urgent" ? "Urgent" : "Normal";

  if (description === "") {
    throw new Error("Please enter a description of the repair.");
  }
  if (reporter === "") {
    throw new Error("Please enter the reporter's name.");
  }

  var now = new Date().toISOString();
  var job = {
    id: nextId(),
    house: "Meadow House",
    description: description,
    reporter: reporter,
    priority: priority,
    status: "New",
    createdAt: now,
    history: [{ at: now, status: "New", note: "Report created" }]
  };

  var jobs = loadJobs();
  jobs.push(job);
  saveJobs(jobs);
  return job;
}

// ---------- Progress and completion ----------

// Moves a job to In Progress and adds a note to its history.
// Can be used again to add more notes. Earlier history is always kept.
function addProgress(id, note) {
  var cleanNote = String(note || "").trim();
  if (cleanNote === "") {
    throw new Error("Please enter a progress note.");
  }

  var jobs = loadJobs();
  var job = null;
  for (var i = 0; i < jobs.length; i++) {
    if (jobs[i].id === id) {
      job = jobs[i];
    }
  }
  if (!job) {
    throw new Error("Job " + id + " was not found.");
  }
  if (job.status === "Completed") {
    throw new Error("Job " + id + " is already completed.");
  }

  job.status = "In Progress";
  job.history.push({
    at: new Date().toISOString(),
    status: "In Progress",
    note: cleanNote
  });
  saveJobs(jobs);
  return job;
}

// Marks a job Completed. A blank or spaces-only note is rejected
// and NOTHING is changed (status, notes and history stay as they were).
function completeJob(id, note) {
  var cleanNote = String(note || "").trim();
  if (cleanNote === "") {
    throw new Error("Please enter a completion note.");
  }

  var jobs = loadJobs();
  var job = null;
  for (var i = 0; i < jobs.length; i++) {
    if (jobs[i].id === id) {
      job = jobs[i];
    }
  }
  if (!job) {
    throw new Error("Job " + id + " was not found.");
  }
  if (job.status === "Completed") {
    throw new Error("Job " + id + " is already completed.");
  }

  job.status = "Completed";
  job.history.push({
    at: new Date().toISOString(),
    status: "Completed",
    note: cleanNote
  });
  saveJobs(jobs);
  return job;
}
