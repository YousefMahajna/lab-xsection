# X-Section Lab

Website: https://yousefmahajna.github.io/lab-xsection/

Process Lab: https://yousefmahajna.github.io/interconnect-process-lab/

The standalone address and the Process Lab tile open this one deployed application. Editing source here updates both entry points after this repository's Pages deployment succeeds.

## Request and analysis workspace

The guided request has three steps: sample and objective, picture and cut plan, and review and submission. Requesters can upload, drop or paste a screenshot, use a built-in drawing, or draw with package parts, cut lines, arrows, dimensions and labels. Built-in SVG rectangles use standard width/height attributes, templates load into the canvas, and the template category filter works. Browser-local IndexedDB preserves an unsubmitted form and drawing; restoring a draft never submits it.

Each saved request has an image gallery, per-image annotations, calibrated distance measurements, a structured measurement table with optional specification limits, and explicit summary, conclusion, disposition and next-action fields. Calibration belongs to the exact optimized image being viewed. Without calibration, distances use pixels. These measurements are an analysis aid; use a calibrated metrology system for acceptance decisions. CSV, printable reports and the existing PowerPoint export include the saved results. Marked report images are derived at export time; originals are not overwritten.

`workspace.js`, `workspace-core.js`, and `workspace.css` enhance the original engineering drawing and shared-request application. `image-storage.js` handles optional Firebase Cloud Storage uploads.

## Image capacity and full-resolution originals

Images are optimized to a maximum 1800-pixel edge and an approximately 240 KB encoded target for shared viewing. This is lossy optimization; do not assume the optimized copy preserves fine metrology detail. A request record remains limited to 8,000,000 serialized characters by the existing database rules. The UI shows usage and rejects an oversized request before writing it.

When the configured Firebase Storage bucket permits uploads, the app saves the original file (up to 60 MB) and a separate optimized viewing copy, storing their references in the request. Original and viewing files do not consume the database record's 8 MB capacity. Native CAD and PDF attachments use this same bucket. Total capacity and cost are determined by the project's Storage quota and billing; the app does not claim unlimited capacity.

If Storage is unavailable, image upload falls back to optimized images inside the request. The gallery and upload status explicitly report that originals were not stored. CAD/PDF upload requires working file storage and does not silently fall back. An unsuccessful Storage attempt disables further attempts for the current page session; reload after configuration changes.

**Administrator setup remains external to this repository:** enable the configured bucket and merge the X-section match block in `firebase-storage.rules` into its existing rules. Preserve other applications' rules. Follow `storage-setup.html`. Publishing this repository does not deploy Firebase rules or enable billing. The supplied Storage rules preserve the existing anonymous-session access model; they do not provide NVIDIA SSO. Download URLs are bearer links and must not be treated as confidential.

## Shared requests and passwordless entry

The page opens immediately, without a login screen or embedded passwords. Firebase creates an anonymous session without asking the visitor for credentials. Anonymous sign-in must be enabled in the existing lab-tracker-nvidia project. Publish the combined rules from `shared-setup.html` once to activate the new `xsectionSharedV1` path. Other applications' rule objects are retained unchanged.

Anyone with the URL can read requests and submit updates. A name and the role shown by the interface are conveniences, not verified identities. The existing Process Lab email selection supplies the display name and lower UI role in the same browser; it does not authenticate that person. Only an existing verified ymahajna@nvidia.com Firebase session may remove a request. Removal preserves its original JSON in a tombstone, and old messages/request contents must not be treated as confidential from other visitors.

Data is stored per request with conditional ETag writes. Independent changes and newly appended messages merge; conflicting edits to the same field stop with a visible error and retain the local version for backup. A failed read is never replaced with sample requests. Polling pauses while a form, reply or unsaved change is active. The page reports saved only after a successful database response. Download backup exports the current browser view, including unsaved edits. Unsaved changes are kept in memory and warn before closing; export them before reloading a failed save.

The source file's three embedded requests were preserved in a local backup during migration and excluded from this public repository. No existing source or original request data was overwritten. The application starts empty until real shared requests are added. Existing data from the original host's proprietary storage has not been migrated automatically.

## Deployment and checks

Settings → Pages → Source: GitHub Actions. Main-branch changes deploy independently of the hub. Run `npm run check` and `npm test` with Node 24. Browser checks cover immediate entry, saving across independent sessions, safe HTML rendering and failure feedback using mocked databases. This repository contains no private account credentials. PowerPoint export uses PptxGenJS from its existing pinned CDN URL.

With Playwright available, `npm run test:browser` exercises guided submission, real template rasterization/filtering, image upload, calibration and annotation persistence, measurement limits, summary persistence across isolated sessions, HTML escaping, failed-save retention, IndexedDB draft restoration, mobile overflow, report generation and both file-storage paths. All database/file writes are mocked; no synthetic records are posted to production. It uses installed Microsoft Edge on Windows and bundled Chromium on other systems. Set `XS_SCREENSHOT_DIR` to retain screenshots. Cloud Storage's live rules and original uploads require separate administrator verification after setup.

