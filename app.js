// create constants for the form and the form controls
const newSessionFormEl = document.getElementsByTagName("form")[0];
const dateInputEl = document.getElementById("date");
const startTimeInputEl = document.getElementById("start-time");
const endTimeInputEl = document.getElementById("end-time");
const STORAGE_KEY = "learner-hours";
const pastSessionContainer = document.getElementById("past-sessions");

// Create a search input element
const searchInputEl = document.createElement("input");
searchInputEl.setAttribute("type", "text");
searchInputEl.setAttribute("placeholder", "Search by date (Y/M/D)");
searchInputEl.addEventListener("input", () => {
  searchSessions(searchInputEl.value);
});
document.body.insertBefore(searchInputEl, pastSessionContainer);

// Listen to form submissions.
newSessionFormEl.addEventListener("submit", (event) => {
  // console.log('You have clicked on the button.')
  // Prevent the form from submitting to the server
  // since everything is client-side.
  event.preventDefault();

  // Get the start and end dates from the form.
  const date = dateInputEl.value;
  const startTime = startTimeInputEl.value;
  const endTime = endTimeInputEl.value;

  // Check if the date is invalid
  if (checkDateInvalid(date)) {
    // If the date is invalid, exit.
    alert("Please enter a valid date.");
    return;
  }

  // Check if the times are invalid
  if (checkTimesInvalid(startTime, endTime)) {
    // If the times are invalid, exit.
    alert("Please ensure the start time is before the end time and both times are filled.");
    return;
  }

  // Check if the form is in edit mode
  const editIndex = newSessionFormEl.getAttribute("data-edit-index");
  if (editIndex !== null) {
    // Update the existing session
    updateSession(editIndex, date, startTime, endTime);
    // Remove the edit mode attribute
    newSessionFormEl.removeAttribute("data-edit-index");
    alert("Entry successfully updated!");
  } else {
    // Check for duplicate session
    if (isDuplicateSession(date, startTime, endTime)) {
      alert("This session already exists. Please enter a different session.");
      return;
    }
    // Storee the new session
    storeNewSession(date, startTime, endTime);
    alert("Entry successfully saved!");
  }

  // Refresh the UI.
  renderPastSessions();

  // Reset the form.
  newSessionFormEl.reset();
});

function checkDateInvalid(date) {
  // Check that date is not null.
  if (!date) {
    
    newSessionFormEl.reset();
    // as date is invalid, we return true
    return true;
  }
  // else
  return false;
}

function checkTimesInvalid(startTime, endTime) {
  // Check that end time is after start time and neither is null.
  
  if (!startTime || !endTime || startTime > endTime) {
    newSessionFormEl.reset();
    alert("Times invalid");
    // as times are invalid, we return true
    return true;
  }
  // else
  return false;
}

function storeNewSession(date, startTime, endTime) {
  // Get data from storage.
  const sessions = getAllStoredSessions();

  // Add the new session object to the end of the array of session objects.
  sessions.push({ date, startTime, endTime,});

  // Sort the array so that sessions are ordered by date, from newest
  // to oldest.
  sessions.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  // Store the updated array back in the storage.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function getAllStoredSessions() {
  // Get the string of session data from localStorage
  const data = window.localStorage.getItem(STORAGE_KEY);

  // If no sessions were stored, default to an empty array
  // otherwise, return the stored data as parsed JSON
  const sessions = data ? JSON.parse(data) : [];

  return sessions;
}

function renderPastSessions() {
  // get the parsed string of sessions, or an empty array.
  const sessions = getAllStoredSessions();

  // exit if there are no sessions
  if (sessions.length === 0) {
    return;
  }

  // Clear the list of past sessions, since we're going to re-render it.
  pastSessionContainer.textContent = "";

  const pastSessionHeader = document.createElement("h2");
  pastSessionHeader.textContent = "Past sessions";

  const pastSessionList = document.createElement("ul");

  // Loop over all sessions and render them.
  sessions.forEach((session, index) => {
    const sessionEl = document.createElement("li");
    sessionEl.textContent = `${formatDate(session.date)} from ${formatTime(
      session.startTime,
    )} to ${formatTime(session.endTime)} `;

    // Create an edit button for each session
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      editSession(index);
    });

    sessionEl.appendChild(editButton);
    pastSessionList.appendChild(sessionEl);
  });

  pastSessionContainer.appendChild(pastSessionHeader);
  pastSessionContainer.appendChild(pastSessionList);
}

function editSession(index) {
  // Get all sessions
  const sessions = getAllStoredSessions();

  // Get the session to edit
  const session = sessions[index];

  // Populate the form with session data
  dateInputEl.value = session.date;
  startTimeInputEl.value = session.startTime;
  endTimeInputEl.value = session.endTime;

  // Set a data attribute on the form to indicate edit mode
  newSessionFormEl.setAttribute("data-edit-index", index);
}

function updateSession(index, date, startTime, endTime) {
  // Get all sessions
  const sessions = getAllStoredSessions();

  // Update the session data
  sessions[index] = { date, startTime, endTime };

  // Store the updated array back in the storage
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

  // Refresh the UI
  renderPastSessions();
}

function isDuplicateSession(date, startTime, endTime) {
  const sessions = getAllStoredSessions();
  return sessions.some(session => 
    session.date === date && 
    session.startTime === startTime && 
    session.endTime === endTime
  );
}

function formatDate(dateString) {
 
  // Convert the date string to a Date object.
  const date = new Date(dateString);

  // Format the date into a locale-specific string.
  return date.toLocaleDateString();

}

function formatTime(timeString) {
  // Change from 24-hour to 12-hour format

  // Separate hour and minutes from timeString
  const [hour, minute] = timeString.split(':');

  // Convert hour from string to integer
  intHour= parseInt(hour);

  // Determine if AM or PM
  period = "AM";
  if (intHour > 12) {
    intHour -= 12;
    period = "PM";
  }
 
  // Display 0 hours as 12 AM
  if (intHour == 0) {
    intHour = 12;
  }

  // Format 12 hour time string
  const formattedTime = intHour + ":" + minute + " " + period;

  return formattedTime;
}

function searchSessions(searchTerm) {
  // Convert search term to the format used in stored sessions (YYYY-MM-DD)
  const formattedSearchTerm = searchTerm.replace(/\//g, '-');

  // Get all sessions
  const sessions = getAllStoredSessions();

  // Filter sessions based on the search term
  const filteredSessions = sessions.filter(session => session.date.includes(formattedSearchTerm));

  // Clear the list of pst sessions
  pastSessionContainer.textContent = "";

  if (filteredSessions.length === 0) {
    const noResultsEl = document.createElement("p");
    noResultsEl.textContent = "No sessions found.";
    pastSessionContainer.appendChild(noResultsEl);
    return;
  }

  const pastSessionHeader = document.createElement("h2");
  pastSessionHeader.textContent = "Search results";

  const pastSessionList = document.createElement("ul");

  // Loop over all filttered sessions and render them.
  filteredSessions.forEach((session, index) => {
    const sessionEl = document.createElement("li");
    sessionEl.textContent = `${formatDate(session.date)} from ${formatTime(
      session.startTime,
    )} to ${formatTime(session.endTime)} `;

    // create an edit button for each session
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      editSession(index);
    });

    sessionEl.appendChild(editButton);
    pastSessionList.appendChild(sessionEl);
  });

  pastSessionContainer.appendChild(pastSessionHeader);
  pastSessionContainer.appendChild(pastSessionList);
}

renderPastSessions();



