# ToDo's

## Namings

- **Report** = A collection expenses for a specific purpose
- **Expense** = A single expense within a report

### Expense Types

- **Receipt** General receipt for a purchase
- **Travel** Fixed travel allowance
- **Food** Food allowance

## Pages

(Admins only)

- [x] Overview over all entries
- [x] Details to an expense report
  - [x] Accept, Decline, Edit Report
  - [x] List of all entries in the report

(All users)

- [x] Overview page with own report
- [x] Create a new expense report
- [x] Details to an expense report
- [x] Edit own expense report

(Others)

- [x] Login

## Functionalities

- [ ] RBAC for pages and api routes


## Futher TODOs (Refactoring)

- [ ] Migrate all components from radix-ui to base-ui
  - [ ] Reinstall the shadcn/ui components
- [ ] Move all forms to their own components
- [ ] Fix authentication issues
  - [ ] Update better-auth config
  - [ ] Update app registration in Azure


# Futher ToDo's

- [x] "Buchungskreise" und "Geschäftseinheit" zusammenfassen zu "Kostenstelle" (siehe Liste)
  - [x] Informationen zu welche Ausgaben zu welcher Kostenstelle gehören
- [x] IBAN + vollständiger Kontoname
- [ ] Kopierbare Details im Report (IBAN, Kontoname, Betrag)
  - [ ] evtl. QR Code für das Kopieren der Details
- [ ] Löschen von Ausgaben im Report
- [ ] Beschreibung des Reports im PDF hervorheben
- [ ] Report ID aufsteigend
- [ ] IBAN vom Antragssteller auf dem PDF
- [ ] Anhänge im PDF REport
- [ ] Kein Prüfer im PDF