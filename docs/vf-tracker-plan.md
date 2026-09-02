# VF Tracker plan

Locked product + chain design for verified products in `packages/vf-app`.
Use this when building so the model does not drift.

Token: `veganfriends.tkn.near`  
DAO / treasury: `vegan-friends.sputnik-dao.near`  
Graph: OnSocial core (`core.onsocial.near`), app id `vf-tracker`  
Hub: `packages/vf-app` only (not the portal)

---

## One-line rule

Everyone stamps themselves. The lot ties the stamps together. VF sells the shelf and the name, not permission to exist.

---

## Layers

| Layer | What it is | Who writes |
| --- | --- | --- |
| Org group | Farm, mill, shop, certifier — their inventory and stamps | That org |
| VF DAO group | Explore shelf / listing only | VF DAO after a listing grant |
| Scan | Compose by `lotId` | Read-only |
| VF Boost | Lock VF → `boost_seconds` | Anyone |
| VF social-spend | Paid endorse / support / boost listing | Anyone |
| Sputnik | Treasury, listing bonds, certifier *features* | DAO |

Do **not** put every SKU inside the DAO group. Do **not** make VegCert ask VF for write access on a farm.

---

## Schema (same for every org)

Kinds under the owner (account now, their core group when they have staff):

```
{owner}/apps/vf-tracker/org/{orgId}
{owner}/apps/vf-tracker/product/{productId}
{owner}/apps/vf-tracker/lot/{lotId}
{owner}/apps/vf-tracker/event/{lotId}/{eventId}
{owner}/apps/vf-tracker/certificate/{certId}
{owner}/apps/vf-tracker/scan/{scanId}
```

Links, not shared folders:

- Lot → `productId`, `producerAccountId`
- Event → `lotId`, `orgAccountId` (mill writes this on **the mill’s** path)
- Certificate → `subjectId` (lot), `issuerAccountId` (certifier writes on **their** path)

QR: `vf:lot:<lotId>` (keep ids globally unique).

Ingredients, claims, category: **fields on the product**. Never path branches. Never a homemade company tree.

---

## Permissions (on-chain, CLI included)

UI is not a lock.

- You can always `Set` on your own tree. CLI can too.
- You cannot `Set` as another account. Core `predecessor` is the stamp.
- Certifiers do **not** get `WRITE` on the producer. They stamp `certificate` on their path with `subjectId = lotId`.
- VF group `listed/{org}` is the only VF write-gate (shelf). Without it they still have a real lot + real VegCert stamp — just not on Explore.
- App mirrors `has_permission` / listing / spend totals. It must not be the gate.

---

## Certifiers (do not blockade)

VegCert and peers are already public names. VF must **not** vote them into existence.

- Scan shows every certificate, labeled as the issuer account.
- “VF listed / featured” is optional promo, not accreditation.
- A nobody can write a cert as themselves; it shows as them, with no VF promo.

---

## Money (`veganfriends.tkn.near`)

Deploy **VF copies** of OnSocial Boost + social-spend, owned by the DAO, token = VF (not SOCIAL).

| Who | Pays | Gets |
| --- | --- | --- |
| Producer / mill | Listing bond → Sputnik, then `listed/` grant | On the VF shelf |
| Anyone | Spend / lock VF | Rank, featured, endorse |
| Consumer | Nothing | Scan |
| Certifier | Nothing required to stamp | Their own name on-chain |

Do not charge per lot line. Do not charge to scan. Do not take a cut of VegCert’s right to certify.

Optional later: featured boost, larger bond to be **featured** as an issuer (still not required to stamp).

---

## Community

- Upvote / rate = **VF social-spend** on a lot or org (costs VF). Free stars do not rank the hub.
- Boost = lock VF so a listing stays visible.
- Endorse / support = paid signal; split can go to the org and to Boost infra/rewards.
- DAO votes fees, slashes listing bonds, features — not every farm and not “who may certify.”

---

## VF app (build this)

1. **Scan / lot page** — compose by `lotId`. Show writer on every stamp. VF shelf badge only if listed.
2. **Studio** — one schema. Session account is the writer. Producer: product/lot. Chain: event. Certifier: certificate on **their** path.
3. **OnSocial seam** — `queryByType` / `queryByPath` / `set` / `completeAppHandoff({ appId: 'vf-tracker' })`. Local mock until SDK is live.
4. **Explore** — VF group listings only. Unlisted lots still resolve by QR.
5. **Later** — org’s own core group for staff wallets; VF Boost + social-spend; listing bond → grant.

---

## Do not build

- A VF tracker contract
- A permission API / UI-only ACL
- Category or department paths
- Certifier grants on producer folders
- All inventory inside the VF DAO group
- Replacing Sputnik for treasury
- Replacing NEAR Social wholesale for names (dual-read later)
- OnAPI key in the browser (`ONSOCIAL_API_KEY` is server-only, reads/index only)

---

## Build order

1. Seam + studio role UX + lot QR (in progress in vf-app)
2. Live session handoff when `@onsocial/sdk` ships
3. Scan composes by `lotId` from org-owned paths
4. Explore = VF listing group
5. Deploy VF Boost + VF social-spend (`veganfriends.tkn.near`)
6. Listing bond → `listed/` grant
7. Per-org groups when a farm has many wallets

---

## Reference (OnSocial, do not fork blindly)

- Core groups + path `WRITE`: `OnSocial-Labs/onsocial-protocol` `contracts/core-onsocial`
- Boost (lock + boost-seconds): `contracts/boost-onsocial` — copy, token = VF
- Spend (action registry, splits, treasury → boost credits): `contracts/social-spend-onsocial` — copy, token = VF, `app_id: vf-tracker`
