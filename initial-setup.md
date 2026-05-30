# Context & Problem

The initial Levy Home App plumbing is now in place.

This repo is an iOS-only Expo app plus a Node/Express API. The app is meant to be a family-facing notification layer on top of Home Assistant. Home Assistant remains the automation brain.

The API already has an authenticated Home Assistant event endpoint:

```text
POST /api/ha/events
Authorization: Bearer <LEVY_HOME_HA_WEBHOOK_SECRET>
```

The MVP event types are:

* `garage_opened`
* `garage_closed`
* `garage_left_open_10_min`
* `garage_opened_after_hours`
* `garage_still_open_at_10pm`
* `doorbell_pressed`
* `doorbell_person_detected`
* `doorbell_motion_detected`

For this stage, focus only on the five garage events:

* `garage_opened`
* `garage_closed`
* `garage_left_open_10_min`
* `garage_opened_after_hours`
* `garage_still_open_at_10pm`

Do not integrate eufy yet.

# Task

Create documentation and example Home Assistant YAML for wiring garage events into the Levy Home API.

This task should mostly be documentation/examples. Do not make major runtime changes unless the current event validation cannot support the documented MVP payloads.

## Required Deliverables

Update or create:

```text
docs/ha-event-map.md
docs/home-assistant-garage-automations.md
docs/local-dev.md
```

If the repo has a better docs naming convention already, follow it, but keep the content clearly discoverable.

---

# Important Entity ID Requirement

Do **not** invent or assume my actual Home Assistant garage entity ID.

Use this placeholder everywhere in examples:

```text
cover.main_garage_door
```

But clearly document that this is only a placeholder.

The docs must instruct me to confirm the real entity ID in:

```text
Home Assistant → Developer Tools → States
```

The docs should explain that I need to look for the actual Meross garage door entity/state there before wiring the real automations.

Do not hardcode any guessed entity ID as if it is real.

---

# Important Nighttime Automation Requirement

Keep these two nighttime garage automations distinct:

1. `garage_opened_after_hours`
2. `garage_still_open_at_10pm`

They are not the same thing.

## `garage_opened_after_hours`

This event means:

```text
The garage changed from closed to open between 10 PM and 7 AM.
```

Example:

```text
Garage was closed at 11:42 PM, then opened.
```

This should send:

```text
garage_opened_after_hours
```

## `garage_still_open_at_10pm`

This event means:

```text
At exactly 10:00 PM, the garage was already open.
```

Example:

```text
Garage opened at 8:15 PM and was never closed. At 10:00 PM, Home Assistant checks and sees it is still open.
```

This should send:

```text
garage_still_open_at_10pm
```

These should remain separate automations in the docs and YAML examples.

Do not merge them into one generic nighttime event.

---

# 1. `docs/ha-event-map.md`

Create a practical event map template for Home Assistant.

It should include placeholders for:

```text
Garage cover/entity ID:
Garage open state:
Garage closed state:
Levy Home API base URL:
Levy Home HA webhook secret:
Timezone:
After-hours window:
```

Use this placeholder example:

```text
cover.main_garage_door
```

But make it very clear that the actual entity ID must be discovered in:

```text
Home Assistant → Developer Tools → States
```

Document the MVP garage events:

| Levy event type             | Trigger                            | Conditions                                                 | Notes                                           |
| --------------------------- | ---------------------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| `garage_opened`             | Garage changes closed → open       | Normal hours only, if avoiding duplicate after-hours alert | Push during MVP                                 |
| `garage_closed`             | Garage changes open → closed       | None                                                       | Push during MVP; may become timeline-only later |
| `garage_left_open_10_min`   | Garage remains open for 10 minutes | None                                                       | High-priority alert                             |
| `garage_opened_after_hours` | Garage changes closed → open       | Between 10 PM and 7 AM                                     | Distinct from the 10 PM still-open check        |
| `garage_still_open_at_10pm` | Time is 10:00 PM                   | Garage is open                                             | Catches garage already open at bedtime          |

Also explain why the two nighttime automations are distinct:

* `garage_opened_after_hours` catches new garage activity between 10 PM and 7 AM.
* `garage_still_open_at_10pm` catches the garage being left open before bedtime.

---

# 2. `docs/home-assistant-garage-automations.md`

Add example Home Assistant YAML.

Include:

1. A `rest_command` example for posting an event to the Levy Home API.
2. Example automations for all five garage events.
3. Clear notes about replacing placeholder values.

Use placeholders like:

```yaml
LEVY_HOME_API_BASE_URL
LEVY_HOME_HA_WEBHOOK_SECRET
cover.main_garage_door
```

The YAML should demonstrate the intended event payload shape expected by the API.

The payloads should include:

```json
{
  "type": "...",
  "category": "garage",
  "severity": "...",
  "title": "...",
  "message": "...",
  "entityId": "cover.main_garage_door",
  "source": "home_assistant"
}
```

Severity suggestions:

```text
garage_opened: normal
garage_closed: normal
garage_left_open_10_min: high
garage_opened_after_hours: high
garage_still_open_at_10pm: high
```

## Required Automation Logic

### `garage_opened`

* Fires when the garage changes from closed to open.
* Should only fire during normal hours if we are avoiding duplicate after-hours alerts.
* Should not also fire when `garage_opened_after_hours` fires.

### `garage_closed`

* Fires when the garage changes from open to closed.
* No time condition.

### `garage_left_open_10_min`

* Fires when the garage has continuously been open for 10 minutes.
* This is duration-based.
* Do not implement it as “opened sometime in the last 10 minutes.”

### `garage_opened_after_hours`

* Fires when the garage changes from closed to open between 10 PM and 7 AM.
* This is about a new open event during the after-hours window.
* Keep it distinct from `garage_still_open_at_10pm`.

### `garage_still_open_at_10pm`

* Fires at exactly 10:00 PM.
* Only sends if the garage is currently open at that time.
* This catches cases where the garage was opened before 10 PM and accidentally left open.
* Keep it distinct from `garage_opened_after_hours`.

---

# 3. `docs/local-dev.md`

Add a section showing how to test the garage event endpoint manually with curl.

Include curl examples for:

* `garage_opened`
* `garage_closed`
* `garage_left_open_10_min`
* `garage_opened_after_hours`
* `garage_still_open_at_10pm`

Each curl example should use the same placeholder entity ID:

```text
cover.main_garage_door
```

But remind me that it must be replaced later with the real Home Assistant entity ID from:

```text
Home Assistant → Developer Tools → States
```

Also include a short checklist:

```text
1. Run the API.
2. Run the Expo app/dev build.
3. Register a push token from the app.
4. Send a fake garage event with curl.
5. Confirm push notification arrives.
6. Confirm event appears in the app timeline.
7. Confirm the real garage entity ID in Home Assistant → Developer Tools → States.
8. Only then wire Home Assistant automations.
```

---

# Critical Requirements

* Do NOT add Supabase.
* Do NOT add eufy.
* Do NOT add real Home Assistant credentials to the repo.
* Do NOT hardcode Josh/Mallory-specific secrets.
* Do NOT invent my actual Home Assistant garage entity ID.
* Use `cover.main_garage_door` only as a documented placeholder.
* Clearly instruct me to find the real entity ID in Home Assistant → Developer Tools → States.
* Keep `garage_opened_after_hours` and `garage_still_open_at_10pm` as separate automations.
* Do NOT merge the two nighttime automations.
* Do NOT build a full Home Assistant dashboard.
* Do NOT change the mobile navigation unless absolutely necessary.
* Do NOT write tests.
* Prefer documentation/examples over implementation changes.
* If you find the API event validation does not support one of these garage event payloads, make the smallest safe fix and document it.

# Notes

The Home Assistant examples do not need to be perfect for my exact setup yet because I still need to confirm the real Meross entity ID.

These docs should give me a clean template to adapt once I discover the actual entity/state values in Home Assistant.

After implementation, summarize:

* files changed
* whether any runtime code changed
* how to test with curl
* what I need to fill in from Home Assistant
* where to find the real garage entity ID
* any assumptions made about entity states