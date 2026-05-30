# Home Assistant Event Map

This file is the practical mapping template for wiring Home Assistant garage
events into Levy Home.

`cover.main_garage_door` is only a placeholder. Before wiring real automations,
confirm the actual Meross garage door entity ID and states in:

```text
Home Assistant → Developer Tools → States
```

Look for the real Meross garage door entity there, then confirm the exact state
values it reports when the garage is open and closed.

## Local Template

```text
Garage cover/entity ID: cover.main_garage_door
Garage open state: open
Garage closed state: closed
Levy Home API base URL: LEVY_HOME_API_BASE_URL
Levy Home HA webhook secret: LEVY_HOME_HA_WEBHOOK_SECRET
Timezone: confirm in Home Assistant system settings
After-hours window: 10:00 PM through 7:00 AM local Home Assistant time
```

Replace `cover.main_garage_door` with the real entity ID from
Home Assistant → Developer Tools → States. The `open` and `closed` state names
are expected for a standard Home Assistant `cover`, but confirm them in States
before copying the YAML into a live setup.

## MVP Garage Events

| Levy event type | Trigger | Conditions | Notes |
| --- | --- | --- | --- |
| `garage_opened` | Garage changes closed → open | Normal hours only, if avoiding duplicate after-hours alert | Push during MVP |
| `garage_closed` | Garage changes open → closed | None | Push during MVP; may become timeline-only later |
| `garage_left_open_10_min` | Garage remains open for 10 minutes | None | High-priority alert |
| `garage_opened_after_hours` | Garage changes closed → open | Between 10 PM and 7 AM | Distinct from the 10 PM still-open check |
| `garage_still_open_at_10pm` | Time is 10:00 PM | Garage is open | Catches garage already open at bedtime |

## Nighttime Events Stay Separate

`garage_opened_after_hours` catches new garage activity between 10 PM and
7 AM. Example: the garage was closed at 11:42 PM, then opened.

`garage_still_open_at_10pm` catches the garage being left open before bedtime.
Example: the garage opened at 8:15 PM and was never closed, then Home Assistant
checks at exactly 10:00 PM and sees it is still open.

These are intentionally separate automations and should not be merged into one
generic nighttime event.

## Later Doorbell Events

Doorbell events remain placeholders for a later stage. Do not wire eufy yet.

| Levy event type | Home Assistant entity | Notes |
| --- | --- | --- |
| `doorbell_pressed` | TBD | Later stage. |
| `doorbell_person_detected` | TBD | Later stage, only if reliable. |
| `doorbell_motion_detected` | TBD | Later stage, only if reliable. |
