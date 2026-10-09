# Integrated synthetic demo

`DemoProvider` wraps the application and exposes typed crew, observation, and task hooks. The three full seeded datasets (`stable`, `reviewing`, `incomplete`) run through the shared `computeBaselines`; the old standalone screen's mocked baseline results are not used.

Synthetic telemetry and task timestamps shift together to a session anchor. The most recent synthetic reading is one hour before that anchor, so the same demonstration remains usable on a later date. Real `user_checkin` timestamps are never moved. Missing task contexts use the existing seeded crew tasks.

Normal check-ins and decisions remain under `astrocare:v1:state`. Active demo records use `demo:astrocare:v1:state`. Entering, switching, and resetting clear only the demo envelope; exiting restores the normal records. A revision change remounts the brief and check-in form so their visible history and saved-form state cannot leak across scenarios. The persisted selection is restored before child screens read storage, including on a crew deep link. Earlier stored scenario `review` migrates to `reviewing`.

Run the regression checks with:

```sh
node --test src/components/demo/demo.test.mjs
```

The tests check all three crews and scenarios on a future clock, personal-record isolation, reload migration, reset failure handling, timestamp preservation, and genuine baseline results.
