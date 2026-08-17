# Al-Hadi-Real-Estate

## Enable photo sharing (one-time setup)

The "Share" button on each property tries to attach the actual photo when
sharing to WhatsApp/Instagram/etc. This requires the Firebase Storage bucket
to allow this site to fetch images (CORS). Without this, sharing silently
falls back to text + link only (no photo).

Run this once (needs the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install), or use Google Cloud Shell in the browser — no install needed):

```
gsutil cors set cors.json gs://YOUR-FIREBASE-BUCKET-NAME
```

Find your bucket name in Firebase Console → Storage (top of the page, looks
like `your-project.appspot.com`).
