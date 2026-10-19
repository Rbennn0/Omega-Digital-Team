function setupReportForm() {
  const container = document.querySelector("#report-form");

  if (!container) return;

  // Works whether #report-form is a form or a container.
  const form = container.matches("form")
    ? container
    : document.createElement("form");

  form.noValidate = true;

  form.innerHTML = `
    <div>
      <label for="repair-description">Description</label>
      <textarea
        id="repair-description"
        name="description"
        rows="4"
        required
        aria-describedby="description-error"
      ></textarea>
      <p id="description-error" hidden></p>
    </div>

    <div>
      <label for="repair-reporter">Reporter name</label>
      <input
        id="repair-reporter"
        name="reporter"
        type="text"
        autocomplete="name"
        required
        aria-describedby="reporter-error"
      >
      <p id="reporter-error" hidden></p>
    </div>

    <div>
      <label for="repair-priority">Priority</label>
      <select id="repair-priority" name="priority">
        <option value="Normal">Normal</option>
        <option value="Urgent">Urgent</option>
      </select>
    </div>

    <button type="submit">Submit report</button>
    <p id="report-save-error" role="alert" hidden></p>
  `;

  if (form !== container) {
    container.replaceChildren(form);
  }

  const description = form.elements.namedItem("description");
  const reporter = form.elements.namedItem("reporter");
  const priority = form.elements.namedItem("priority");
  const saveError = form.querySelector("#report-save-error");

  const fields = [
    {
      input: description,
      error: form.querySelector("#description-error"),
      message: "Please enter a description of the repair."
    },
    {
      input: reporter,
      error: form.querySelector("#reporter-error"),
      message: "Please enter the reporter's name."
    }
  ];

  function validateField(field) {
    const valid = field.input.value.trim() !== "";

    field.error.textContent = valid ? "" : field.message;
    field.error.hidden = valid;

    if (valid) {
      field.input.removeAttribute("aria-invalid");
    } else {
      field.input.setAttribute("aria-invalid", "true");
    }

    return valid;
  }

  fields.forEach((field) => {
    field.input.addEventListener("input", () => {
      if (field.input.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    saveError.hidden = true;
    saveError.textContent = "";

    let firstInvalid = null;

    fields.forEach((field) => {
      if (!validateField(field) && !firstInvalid) {
        firstInvalid = field.input;
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const report = {
      description: description.value.trim(),
      reporter: reporter.value.trim(),
      priority: priority.value
    };

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;

    let job;

    try {
      job = await createJob(report);
    } catch (error) {
      saveError.textContent =
        "The report could not be saved. Your entries have been kept. Please try again.";
      saveError.hidden = false;
      button.disabled = false;
      return;
    }

    form.reset();
    button.disabled = false;

    renderJobs();

    announce(
      `Job ${job.id} created: ${report.description} (${report.priority})`
    );
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupReportForm);
} else {
  setupReportForm();
}
