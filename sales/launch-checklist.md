# Launch checklist (after the deposit)

## 1. Collect the extra detail (the final site is much richer than the demo)
- [ ] Run the intake in `sales/client-intake.md`: confirmed facts, owner story, credentials, process, payments, FAQ answers
- [ ] 6–12 photos: owner/team (hero), 4–8 real jobs (gallery), logo
- [ ] 3–6 real reviews with permission to quote
- [ ] Confirm every item under "Confirm before launch" in their lead file

## 2. Build the final version
- [ ] Put photos in `clients/<slug>/assets/` and fill in `clients/<slug>/config.json` (use `clients/example-hvac/config.json` as the model). Set `"demo": false`.
- [ ] Every service needs an `id` from `content/services/` (gets an in-depth service page) or its own `details`
- [ ] `node scripts/build.mjs <slug>`: builds the home page, one page per service, privacy, thanks, sitemap and robots
- [ ] Send the owner the preview link, get written approval, then set `confirmed`
- [ ] **`node scripts/check-final.mjs <slug>` must pass.** Don't launch until it does.

## 3. Domain + hosting
- [ ] Domain in the **client's name** (Cloudflare, Porkbun or Namecheap, about $10–12/yr). Reuse their existing domain if they have one.
- [ ] Netlify (free): create a site and drag in `dist/<slug>/`, or connect this repo with publish dir `dist/<slug>` and build command `node scripts/build.mjs <slug>`
- [ ] Netlify, then Forms: confirm "service-request" appears, and add an email notification to the client's address
- [ ] Connect the domain. HTTPS is automatic.

## 4. Listings (the Standard tier, and what really moves calls)
- [ ] Google Business Profile: claim or verify, add the website URL, and make name, address, phone and hours **identical** to the site
- [ ] Claim Yelp (free) and fix NAP. Update the website field on Facebook, Nextdoor, BBB and Yellow Pages.
- [ ] Google Search Console: add the domain and submit `https://<domain>/`

## 5. Test and hand off
- [ ] Tap the call button on a real phone. It must dial the right number.
- [ ] Submit the form and confirm the client receives it
- [ ] Collect the balance and start the $39/mo Care Plan invoice
- [ ] Ask for a Google review and a referral to another trade (plumber, electrician)
