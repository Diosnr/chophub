# ChopHub

> Nigerian food marketplace. Vendors list fresh catfish, frozen chicken, and cooked African foods. Customers order, pay via Monnify, get dispatched.

This README is the source of truth for the product, architecture, and build plan. When in doubt, this wins.

---

## What this is

A two-sided marketplace for the Nigerian market:

- **Customers** browse a catalog of fresh catfish (priced per kg), frozen chicken (priced per pack), and cooked African foods (priced per plate). They cart, checkout via Monnify, and get delivery dispatched.
- **Vendors** apply, get approved by admin, list products, manage inventory, accept incoming orders.
- **Admin** runs the platform: sets delivery fee, creates coupons, approves vendors, sees everything.

The web app ships first. Phase 2 wraps the same web app via Capacitor into a native Android `.aab` for Google Play.

---

## How your checklist became the product

| Your note | What we built |
|---|---|
| Live catfish of any size and weight | Product type `live-catfish`, priced per kg, customer picks weight at order time |
| Food (cooked food & chips — African foods) | Product type `cooked-food`, priced per plate |
| Play orders, dispatched | Cart → order placed → vendor accepts → ready → dispatched → delivered |
| Compensation for referrals | Each user gets a referral code. Referee signs up with it. First paid order triggers a credit to the referrer |
| Coupons/discounts | Admin creates codes (% or fixed), customer applies at checkout |
| Signup/login | JWT auth, email + password + phone |
| Monnify integration | Card, bank transfer, USSD via Monnify REST + webhook |
| Convenience during payments | Saved payment refs, optional wallet top-up + pay-from-wallet at checkout |
| Delivery fee set in admin | `settings.deliveryFee` key, admin edits it, applied at checkout |
| Purchase of units from money conversion | Wallet: user tops up via Monnify, balance in units, used to pay. Admin sets `walletUnitPrice` |
| Frozen chicken | Product type `frozen-chicken`, priced per pack |
| Marketplace + vendors + admin panel | Three roles in one app, role-based routes |

---

## User roles

- **Customer** — browse, order, pay, track
- **Vendor** — list products, manage inventory, accept/fulfill orders
- **Admin** — manage everything: delivery fee, coupons, vendors, users, referral payouts

(Dispatcher role is post-MVP — admin manually assigns for now.)

---

## MVP scope (Phase 1 — web)

Must-have for first launch:

- [ ] Auth (signup, login, logout, JWT)
- [ ] Vendor application + admin approval
- [ ] Product CRUD (vendor) — 3 categories: live-catfish, frozen-chicken, cooked-food
- [ ] Customer browse + filter
- [ ] Cart (multi-vendor, persistent)
- [ ] Coupon apply
- [ ] Checkout via Monnify OR wallet
- [ ] Order placement + status flow (pending → accepted → ready → dispatched → delivered)
- [ ] Admin panel:
  - [ ] Approve/reject vendors
  - [ ] Edit delivery fee
  - [ ] Create coupons
  - [ ] View + manage orders
  - [ ] Manage users
- [ ] Referral system (code on signup, reward on referee's first paid order)
- [ ] Wallet top-up via Monnify, balance + history

Out of scope for MVP:

- Real-time order tracking (admin manually updates status; SMS notifications later)
- Reviews/ratings
- Vendor analytics dashboards
- Dispatcher role
- Push notifications

---

## Architecture

### Stack

- **Frontend:** Vite + React + TypeScript, Tailwind CSS, React Router, Zustand
- **Backend:** Node.js + Express + TypeScript, Mongoose, JWT, bcrypt
- **Database:** MongoDB Atlas (free M0 cluster)
- **Payments:** Monnify REST API + webhook
- **Hosting:** Render (web static + API service)
- **Mobile (Phase 2):** Capacitor wrap → Android Studio → `.aab`

### Why this stack

- Vite + React is fast to build, easy to wrap with Capacitor for Android `.aab`
- Express + Mongoose fits MongoDB Atlas free tier, deploys cleanly to Render
- Capacitor wraps the existing web app into an Android shell — no rewrite

### Repo structure (monorepo)

```
chophub/
├── apps/
│   ├── web/                 # Vite + React frontend
│   └── api/                 # Express + Mongoose backend
├── packages/
│   └── shared/              # Shared TS types
├── README.md                # Source of truth (this doc)
├── .env.example             # Template for env vars
├── .gitignore
├── package.json             # Root, npm workspaces
└── render.yaml              # Render deploy config
```

### Data model (MongoDB collections)

**users**
```
_id, email, passwordHash, name, phone, role (customer|vendor|admin),
walletBalance (units), referralCode, referredBy, createdAt
```

**vendors**
```
_id, userId, businessName, description, logo, status (pending|approved|rejected), createdAt
```

**products**
```
_id, vendorId, name, description, images[], category (live-catfish|frozen-chicken|cooked-food|other),
pricingType (fixed|per-kg|per-unit), price, stock, status, createdAt
```

**orders**
```
_id, customerId, items[{productId, vendorId, qty, weightKg?, unitPrice, lineTotal}],
subtotal, deliveryFee, couponDiscount, total, paymentMethod (monnify|wallet),
paymentStatus (pending|paid|failed), orderStatus (pending|accepted|ready|dispatched|delivered|cancelled),
deliveryAddress, monnifyReference, couponCode?, createdAt
```

**coupons**
```
_id, code, type (percent|fixed), value, minOrder, expiresAt, usageLimit, usedCount, createdBy
```

**referrals**
```
_id, referrerId, refereeId, orderId, rewardAmount (units), status (pending|paid), createdAt
```

**wallet_transactions**
```
_id, userId, type (topup|purchase|referral|refund), amount (units, signed),
ref (monnifyRef|orderId), createdAt
```

**settings**
```
_id, key, value
// e.g. deliveryFee=500, walletUnitPrice=100, referralReward=50
```

### API surface (REST)

**Auth**
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`

**Users**
- `GET /api/users/me`
- `PATCH /api/users/me`

**Vendors**
- `POST /api/vendors` (apply)
- `GET /api/vendors` (list approved)
- `GET /api/vendors/:id`

**Products**
- `GET /api/products` (filters: category, vendor)
- `POST /api/products` (vendor)
- `PATCH /api/products/:id` (vendor)
- `DELETE /api/products/:id` (vendor)

**Orders**
- `POST /api/orders` (create)
- `GET /api/orders/me`
- `GET /api/orders/vendor/me`
- `PATCH /api/orders/:id/status`

**Coupons**
- `POST /api/coupons/validate` (apply code)

**Payments**
- `POST /api/payments/monnify/init`
- `POST /api/payments/monnify/webhook`
- `POST /api/wallet/topup`
- `GET /api/wallet/me`

**Admin**
- `GET /api/admin/orders`
- `POST /api/admin/coupons`
- `PATCH /api/admin/settings/:key`
- `POST /api/admin/vendors/:id/approve`
- `POST /api/admin/vendors/:id/reject`
- `GET /api/admin/users`

### Payment flow (Monnify)

1. Customer checks out → frontend calls `POST /api/payments/monnify/init`
2. Backend creates a Monnify transaction, returns `paymentReference` + `checkoutUrl`
3. Customer redirected to Monnify checkout, pays via card / transfer / USSD
4. Monnify sends webhook → backend verifies signature, marks order paid
5. Order moves to `pending` (vendor sees it, accepts)
6. For wallet top-up: same flow, credit user's `walletBalance` on webhook

### Environment variables

**apps/api/.env**
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/chophub?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
MONNIFY_API_KEY=...
MONNIFY_SECRET_KEY=...
MONNIFY_CONTRACT_CODE=...
MONNIFY_WEBHOOK_SECRET=...
PORT=4000
NODE_ENV=development
```

**apps/web/.env**
```
VITE_API_URL=http://localhost:4000
VITE_MONNIFY_PUBLIC_KEY=...
```

### Mobile app path (Phase 2)

1. `npm install @capacitor/core @capacitor/cli @capacitor/android`
2. `npx cap init ChopHub com.chophub.app --web-dir=apps/web/dist`
3. `npx cap add android`
4. Configure `android/app/build.gradle` for signing
5. `npm run build && npx cap sync`
6. Android Studio → Build → Generate Signed Bundle → `.aab`
7. Upload to Google Play Console

---

## Roadmap

**Phase 1 — Web MVP (current)**
1. Repo + source-of-truth spec (this commit)
2. Scaffold (Vite + Express + Mongoose)
3. Auth (signup/login)
4. Vendor onboarding + product listing
5. Customer browse + cart + checkout (Monnify + wallet)
6. Admin panel (delivery fee, coupons, vendors, orders)
7. Referral system + wallet top-up flow

**Phase 2 — Android `.aab`**
1. Capacitor wrap
2. Build signed `.aab`
3. Play Store listing

**Phase 3 — Polish**
1. Real-time tracking
2. Reviews/ratings
3. Vendor analytics
4. Dispatcher role

---

## Publishing to Google Play Store

This is the playbook for wrapping the ChopHub web app into an Android `.aab` and uploading it to the Google Play Store. Run these from your local machine, not from the sandbox — Android Studio + Gradle + the Android SDK are required.

### Prerequisites (install once)

```bash
# macOS (Homebrew)
brew install --cask zulu@17          # JDK 17
brew install --cask android-studio    # Android SDK + platform-tools + emulator

# Linux (Ubuntu/Debian)
sudo apt install openjdk-17-jdk
sudo snap install android-studio --classic

# Set env vars (add to ~/.zshrc or ~/.bashrc)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)   # macOS
export ANDROID_HOME=$HOME/Library/Android/sdk      # macOS
# OR
export ANDROID_HOME=$HOME/Android/Sdk              # Linux
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

Verify:
```bash
java -version           # openjdk version "17.x.x"
adb --version
```

### 1. Clone + install

```bash
git clone https://github.com/Diosnr/chophub.git
cd chophub
bun install
cd apps/web && bun install && cd ../..
cd apps/api && bun install && cd ..
```

### 2. Initialize Capacitor Android (one-time)

```bash
cd apps/web
bun x cap add android
cd ../..
```

This creates `apps/web/android/` with a full Android Studio project.

### 3. Configure `capacitor.config.ts`

Edit `apps/web/capacitor.config.ts`:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chophub.app',
  appName: 'ChopHub',
  webDir: 'dist',
  server: {
    url: 'https://chophub-api.onrender.com',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ea580c',
  },
};

export default config;
```

### 4. Generate Android signing keystore (one-time)

The keystore signs every release. Guard it like a password — losing it means losing your Play Store identity.

```bash
keytool -genkey -v \
  -keystore ~/chophub-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias chophub
```

You'll be prompted for two passwords — **save these in a password manager**. You'll also be prompted for your name, organization, and location.

```bash
# Move keystore into the android project
mv ~/chophub-release-key.jks apps/web/android/app/
```

### 5. Configure Gradle signing

Create `apps/web/android/app/keystore.properties` (NOT committed to git):
```
storeFile=chophub-release-key.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=chophub
keyPassword=YOUR_KEY_PASSWORD
```

Add `keystore.properties` to `apps/web/android/.gitignore`:
```
keystore.properties
*.jks
```

Edit `apps/web/android/app/build.gradle` — add a `signingConfigs` block and reference it from `release`:
```gradle
android {
    // ... existing config ...

    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("app/keystore.properties")
            def keystoreProperties = new Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 6. Build the `.aab`

```bash
cd apps/web
bun x vite build
bun x cap sync android
cd android
./gradlew bundleRelease
```

Output:
```
apps/web/android/app/build/outputs/bundle/release/app-release.aab
```

### 7. Set up Google Play Console (one-time)

1. Pay the **$25 one-time developer fee** at https://play.google.com/console
2. Create a new app:
   - App name: `ChopHub`
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
3. Fill in **App content**:
   - Privacy policy URL: host a privacy policy (can be a single GitHub Pages page)
   - App access: all functionality available without special access
   - Ads: no
   - Data safety: declare what you collect (email, name, phone, address, payment info via Monnify)
   - Government apps: no
   - Financial features: yes (you process payments)
4. **Store listing**:
   - Short description (80 chars): `Fresh catfish, chicken, cooked African food — delivered.`
   - Full description (4000 chars): see `PLAY_STORE_LISTING.md` (template below)
   - Screenshots: minimum 2 per device type (phone + tablet). Use the Android emulator to capture.
   - App icon: 512×512 PNG (transparent background). Use Figma or AI generation.
   - Feature graphic: 1024×500 PNG
5. **Release → Production → Create new release**:
   - Upload `app-release.aab`
   - Release name: `1.0.0` (semver)
   - Release notes: `Initial release`

### 8. Submit for review

Click **Review release → Start rollout to Production**. Google takes 1–7 days for the first review. After approval, the app appears on Play Store within hours.

### 9. Updates

To push a new version:
1. Bump version in `apps/web/android/app/build.gradle` (`versionCode` + `versionName`)
2. Rebuild: `cd apps/web/android && ./gradlew bundleRelease`
3. Play Console → Release → Create new release → upload new `.aab`

---

### Passwords checklist

When you generate the keystore, **save these in your password manager**:

| Item | Where it's used |
|---|---|
| Keystore password | `keystore.properties` → `storePassword` |
| Key password | `keystore.properties` → `keyPassword` |
| Keystore file | `apps/web/android/app/chophub-release-key.jks` |
| Key alias | `keystore.properties` → `keyAlias` (default: `chophub`) |
| Google Play Console login | https://play.google.com/console |
| Zepto Mail API token | Render env var `ZEPTO_API_TOKEN` |
| Render API key | for redeploys |
| MongoDB Atlas password | Render env var `MONGO_URI` |

**If you lose the keystore file or its passwords, you can never update the app again — Google Play will treat any new keystore as a different app.** Back up the `.jks` file to a secure cloud location.

---

## Test accounts (after running seed script)

```
Superadmin: ekookun8@gmail.com / chophub2026
Vendors:    adebayo.fish@chophub.test / vendorpass123
            mama.chicken@chophub.test / vendorpass123
            jollof.king@chophub.test / vendorpass123
            (6 more — see scripts/seed-dummy-data.ts)
Customers:  smoke2@chophub.test / smoketest123
```

Seed script: `cd apps/api && bun run scripts/seed-dummy-data.ts`

---

*Last updated: 2026-06-29 — Lagos*
