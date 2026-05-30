# Home Assistant Garage Automations

These examples show how Home Assistant can send the five MVP garage events to
the Levy Home API.

`cover.main_garage_door` is only a placeholder. Before using this YAML, confirm
the actual Meross garage door entity ID and its open/closed state values in:

```text
Home Assistant → Developer Tools → States
```

Also replace:

- `LEVY_HOME_API_BASE_URL` with the reachable Levy Home API URL.
- `LEVY_HOME_HA_WEBHOOK_SECRET` with the secret from the API environment.
- `cover.main_garage_door` with the real garage entity ID from Home Assistant.

Do not commit real Home Assistant credentials or real webhook secrets to this
repo.

## REST Command

Add a REST command like this to Home Assistant. The examples below call this
single command with different event values.

```yaml
rest_command:
  levy_home_post_event:
    url: "LEVY_HOME_API_BASE_URL/api/ha/events"
    method: POST
    timeout: 10
    headers:
      Authorization: "Bearer LEVY_HOME_HA_WEBHOOK_SECRET"
      Content-Type: "application/json"
    payload: >
      {
        "type": "{{ type }}",
        "category": "{{ category }}",
        "severity": "{{ severity }}",
        "title": "{{ title }}",
        "message": "{{ message }}",
        "entityId": "{{ garage_entity_id }}",
        "source": "home_assistant",
        "occurredAt": "{{ now().isoformat() }}"
      }
```

The automation snippets below are shown independently in `configuration.yaml`
style. If your setup keeps automations in `automations.yaml`, adapt each list
item to that file's format.

## Garage Opened

This fires when the garage changes from closed to open during normal hours. The
time condition avoids also firing this event when `garage_opened_after_hours`
fires.

```yaml
automation:
  - alias: "Levy Home - Garage opened"
    id: levy_home_garage_opened
    mode: single
    trigger:
      - platform: state
        entity_id: cover.main_garage_door
        from: "closed"
        to: "open"
    condition:
      - condition: time
        after: "07:00:00"
        before: "22:00:00"
    action:
      - service: rest_command.levy_home_post_event
        data:
          type: garage_opened
          category: garage
          severity: normal
          title: "Garage opened"
          message: "The garage door opened."
          garage_entity_id: cover.main_garage_door
```

## Garage Closed

This fires whenever the garage changes from open to closed.

```yaml
automation:
  - alias: "Levy Home - Garage closed"
    id: levy_home_garage_closed
    mode: single
    trigger:
      - platform: state
        entity_id: cover.main_garage_door
        from: "open"
        to: "closed"
    action:
      - service: rest_command.levy_home_post_event
        data:
          type: garage_closed
          category: garage
          severity: normal
          title: "Garage closed"
          message: "The garage door closed."
          garage_entity_id: cover.main_garage_door
```

## Garage Left Open For 10 Minutes

This is duration-based. It fires only when the garage has continuously been open
for 10 minutes.

```yaml
automation:
  - alias: "Levy Home - Garage left open for 10 minutes"
    id: levy_home_garage_left_open_10_min
    mode: single
    trigger:
      - platform: state
        entity_id: cover.main_garage_door
        to: "open"
        for: "00:10:00"
    action:
      - service: rest_command.levy_home_post_event
        data:
          type: garage_left_open_10_min
          category: garage
          severity: high
          title: "Garage left open"
          message: "The garage has been open for 10 minutes."
          garage_entity_id: cover.main_garage_door
```

## Garage Opened After Hours

This fires when the garage changes from closed to open between 10 PM and 7 AM.
It is about a new open event during the after-hours window.

Keep this distinct from `garage_still_open_at_10pm`.

```yaml
automation:
  - alias: "Levy Home - Garage opened after hours"
    id: levy_home_garage_opened_after_hours
    mode: single
    trigger:
      - platform: state
        entity_id: cover.main_garage_door
        from: "closed"
        to: "open"
    condition:
      - condition: time
        after: "22:00:00"
        before: "07:00:00"
    action:
      - service: rest_command.levy_home_post_event
        data:
          type: garage_opened_after_hours
          category: garage
          severity: high
          title: "Garage opened after hours"
          message: "The garage opened between 10 PM and 7 AM."
          garage_entity_id: cover.main_garage_door
```

## Garage Still Open At 10 PM

This fires at exactly 10:00 PM only if the garage is currently open. It catches
cases where the garage was opened before 10 PM and accidentally left open.

Keep this distinct from `garage_opened_after_hours`.

```yaml
automation:
  - alias: "Levy Home - Garage still open at 10 PM"
    id: levy_home_garage_still_open_at_10pm
    mode: single
    trigger:
      - platform: time
        at: "22:00:00"
    condition:
      - condition: state
        entity_id: cover.main_garage_door
        state: "open"
    action:
      - service: rest_command.levy_home_post_event
        data:
          type: garage_still_open_at_10pm
          category: garage
          severity: high
          title: "Garage still open"
          message: "The garage is still open at 10 PM."
          garage_entity_id: cover.main_garage_door
```

## Assumptions To Verify

- The placeholder entity ID is `cover.main_garage_door`.
- The real entity ID must be confirmed in Home Assistant → Developer Tools → States.
- The examples assume the cover state is exactly `open` or `closed`.
- The after-hours window uses Home Assistant local time from 10 PM through 7 AM.
- The normal `garage_opened` automation intentionally excludes after-hours opens
  to avoid duplicate pushes.
