/*
 * reminders.js — Create, list, and delete daily reminders.
 *
 * The scheduler pushes these through Telegram, so they only actually fire once
 * the account is linked.
 */

async function loadReminders() {
  const container = document.getElementById("reminders-list");

  let reminders;
  try {
    reminders = await API.reminders();
  } catch (error) {
    container.innerHTML = `<p class="empty">${error.message}</p>`;
    return;
  }

  if (!reminders.length) {
    container.innerHTML = '<p class="empty">No reminders yet.</p>';
    return;
  }

  container.innerHTML = reminders
    .map(
      (reminder) => `
        <div class="reminder">
          <span class="time">${reminder.remind_at}</span>
          <span class="text">${escapeHtml(reminder.message)}</span>
          <button class="btn btn-sm" data-delete="${reminder.id}" title="Delete">✕</button>
        </div>`
    )
    .join("");

  container.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await API.deleteReminder(Number(button.dataset.delete));
        toast("Reminder deleted");
        await loadReminders();
      } catch (error) {
        toast(error.message, true);
        button.disabled = false;
      }
    });
  });
}

function initReminderForm() {
  document.getElementById("reminder-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const time = document.getElementById("reminder-time").value;
    const messageInput = document.getElementById("reminder-message");
    const message = messageInput.value.trim();
    const button = event.target.querySelector("button[type=submit]");

    if (!time) {
      toast("Pick a time first.", true);
      return;
    }
    if (!message) {
      toast("The reminder message cannot be empty.", true);
      return;
    }

    button.disabled = true;
    try {
      await API.createReminder({ message, remind_at: time });
      messageInput.value = "";
      toast(`Reminder set for ${time}`);
      await loadReminders();
    } catch (error) {
      toast(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}
