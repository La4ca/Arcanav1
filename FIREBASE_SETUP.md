# 🔥 Arcana — Firebase Setup Guide

Follow these steps **once** to connect Arcana to your own Firebase project.

---

## Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → give it a name (e.g. `arcana-repo`)
3. Disable Google Analytics (not needed) → **Create project**

---

## Step 2 — Enable Authentication

1. In Firebase Console → **Authentication** → **Get started**
2. Under **Sign-in method** → click **Email/Password** → **Enable** → Save

---

## Step 3 — Create Firestore Database

1. In Firebase Console → **Firestore Database** → **Create database**
2. Choose **Start in test mode** (you can tighten rules later)
3. Pick any region → **Done**

### Firestore Security Rules (paste into Rules tab)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Step 4 — Register a Web App

1. In Firebase Console → **Project Overview** → click **</>** (Web)
2. Give it a nickname (e.g. `arcana-web`) → **Register app**
3. Copy the `firebaseConfig` object shown

---

## Step 5 — Paste Config into Arcana

Open `src/lib/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "arcana-repo.firebaseapp.com",
  projectId: "arcana-repo",
  storageBucket: "arcana-repo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

---

## Step 6 — Seed the Database (One Time)

1. Run `npm run dev` to start the app
2. Open [http://localhost:5173/setup](http://localhost:5173/setup)
3. Click **Run Setup** — this will:
   - Create 5 Firebase Auth accounts
   - Populate all Firestore collections with demo data
4. Wait for the green ✓ **Setup complete!** message

---

## Step 7 — Log In

Go to [http://localhost:5173](http://localhost:5173)

Use the **Quick Login** buttons or sign in manually:

| Role       | Email                      | Password   |
|------------|----------------------------|------------|
| Admin      | owner@arcana.local         | arcana123  |
| Developer  | dev@arcana.local           | arcana123  |
| Maintainer | maintainer@arcana.local    | arcana123  |
| Auditor    | auditor@arcana.local       | arcana123  |
| Viewer     | viewer@arcana.local        | arcana123  |

---

## How Data Works

| Feature             | Firebase Service Used         |
|---------------------|-------------------------------|
| Login / Logout      | Firebase Authentication       |
| Users, Repos, Files | Firestore (real-time)         |
| Activity Logs       | Firestore (real-time)         |
| JIT Access Grants   | Firestore (real-time)         |
| Access Requests     | Firestore (real-time)         |

All data is **live** — changes from one browser tab appear instantly in another.

---

## Collections in Firestore

| Collection       | Description                            |
|------------------|----------------------------------------|
| `users`          | User profiles and roles                |
| `repos`          | Repository metadata                    |
| `repoAccess`     | Per-user, per-repo role grants         |
| `repoInvites`    | Pending / accepted / declined invites  |
| `files`          | File content per repository            |
| `commits`        | Commit history per repository          |
| `logs`           | Immutable activity audit log           |
| `accessRequests` | JIT trade-secret access requests       |
| `jitGrants`      | Active time-limited access grants      |
