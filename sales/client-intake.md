# Client intake: what we collect for the final website

Send this (or walk through it on a 20-minute call) right after the deposit is paid.
**The final site must have far more real detail than the demo.** `node scripts/check-final.mjs <slug>` won't pass until these are filled in.
Each item lists the `config.json` field it goes into.

## 1. Confirm the basics (fix anything the demo got wrong)
- Exact business name as you want it shown → `businessName`
- Main phone number, and whether you take texts → `phone`, `hours`
- Email address for website requests → `email`
- Street address to publish, or "service area only" (no address shown) → `street` / `serviceAreaOnly`
- Hours for each day, and what customers should do after hours → `hoursTable`, `emergency`
- Every town you serve → `serviceAreas`
- Domain name you own or want (e.g. yourbusiness.com) → `siteUrl`

## 2. Your story (the About section and owner bio)
- When and why did you start the business? → `aboutParagraphs`
- What do customers say you do differently? → `aboutParagraphs`, `highlights`
- Owner name, role and 2-3 sentences about you; same for key team members → `team`
- Family-owned? Veteran-owned? Local roots? (only if true) → `badges`

## 3. Credentials (only what you can back up)
- License number(s) → `credentials`
- Insured? Bonded? → `credentials`
- Certifications (e.g. EPA 608, manufacturer training) and memberships (Chamber, BBB) → `credentials`
- Brands you install or are authorized for → `brands`

## 4. Services
- Confirm the full service list and remove anything you don't do → `services`
- Anything you want to be known for (geothermal, tankless, older homes, commercial)? → `services`, `highlights`
- Services you **don't** offer, so we never claim them

## 5. How you work
- What happens when someone calls, in 3-4 steps → `process`
- Trip or diagnostic fee? Free estimates? (only what's true) → `faq`
- Warranty or workmanship guarantee (exact terms) → `guarantees`
- Payment methods accepted, financing offered → `payments`, `financing`
- 2-4 questions customers ask you all the time, with your answers → `faq`

## 6. Photos (the single biggest upgrade over the demo)
Ask for 6-12 photos from their phone:
- Owner/team photo, ideally with the truck or van → `heroImage`, `team[].photo`
- 4-8 finished-job photos (clean installs, before/after) → `gallery` (with a one-line caption each)
- Logo file, if they have one → `logo`, `favicon`

Save the files in `clients/<slug>/assets/` and reference them by file name.

## 7. Reviews
- 3-6 favorite reviews (Google, Facebook, Nextdoor, Angi), with permission to quote first name + last initial → `reviews` (each needs `source` and `"permission": true`)
- Link to their Google or Facebook reviews → `reviewLinks`
- Facebook, Google Business Profile and other profile links → `social`

## 8. Sign-off
Send the owner the preview link and get a written "approved" (text or email is fine) before launch:
```json
"confirmed": { "facts": true, "photosPermission": true, "reviewsPermission": true, "copyApproved": true }
```
