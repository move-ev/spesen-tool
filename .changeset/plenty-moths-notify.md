---
"@zemio/web": patch
---

Send the submission confirmation to owners who never opened their notification
preferences.

A missing preferences row was emitted as `null` and compared against `ALL`, so
the confirmation was skipped — while the same `null` passed the status-change
check and those emails were sent. Both now see the `ALL` that the schema default
and the preferences screen already promised.
