# Launch checklist (after the deposit)

## 1. Collect from the client
- [ ] Confirm every item under "Confirm before launch" in their lead file
- [ ] Email address for form leads
- [ ] Logo (if any) and 3–6 photos of the team, vans or real jobs (theirs, with permission)
- [ ] Real reviews they want quoted (first name + last initial) and permission to use them

## 2. Finalize the site
- [ ] Edit `clients/<slug>/config.json`: set `"demo": false`, add `email`, fix any details, and add `reviews`
- [ ] `node scripts/build.mjs <slug>` then check `dist/<slug>/index.html` on a phone

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
