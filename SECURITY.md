# Security

Git Time Machine processes untrusted archives in the browser and never executes their contents.

Current safeguards:

- ZIP paths are normalized before use.
- `.` and `..` traversal segments are removed.
- Common generated and dependency folders are ignored.
- Archive, file count, and per-file size limits are enforced.
- Uploaded code is decoded only as text or hashed as bytes.
- No archive content is sent to a backend.

Do not use the generated history as cryptographic proof. It is an explainable reconstruction intended for review.
