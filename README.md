# X-Section Lab

Website: https://yousefmahajna.github.io/lab-xsection/

Process Lab: https://yousefmahajna.github.io/interconnect-process-lab/

The standalone address and the Process Lab tile open this one deployed application. Editing source here updates both entry points after this repository's Pages deployment succeeds.

## Shared requests and passwordless entry

The page opens immediately, without a login screen or embedded passwords. Firebase creates an anonymous session without asking the visitor for credentials. Anonymous sign-in must be enabled in the existing lab-tracker-nvidia project. Publish the combined rules from `shared-setup.html` once to activate the new `xsectionSharedV1` path. Other applications' rule objects are retained unchanged.

Anyone with the URL can read requests and submit updates. A name and the role shown by the interface are conveniences, not verified identities. The existing Process Lab email selection supplies the display name and lower UI role in the same browser; it does not authenticate that person. Only an existing verified ymahajna@nvidia.com Firebase session may remove a request. Removal preserves its original JSON in a tombstone, and old messages/request contents must not be treated as confidential from other visitors.

Data is stored per request with conditional ETag writes. Independent changes and newly appended messages merge; conflicting edits to the same field stop with a visible error and retain the local version for backup. A failed read is never replaced with sample requests. Polling pauses while a form, reply or unsaved change is active. The page reports saved only after a successful database response. Download backup exports the current browser view, including unsaved edits. Unsaved changes are kept in memory and warn before closing; export them before reloading a failed save.

The source file's three embedded requests were preserved in a local backup during migration and excluded from this public repository. No existing source or original request data was overwritten. The application starts empty until real shared requests are added. Existing data from the original host's proprietary storage has not been migrated automatically.

## Deployment and checks

Settings → Pages → Source: GitHub Actions. Main-branch changes deploy independently of the hub. Run `npm run check` and `npm test` with Node 24. Browser checks cover immediate entry, saving across independent sessions, safe HTML rendering and failure feedback using mocked databases. This repository contains no private account credentials. PowerPoint export uses PptxGenJS from its existing pinned CDN URL.

