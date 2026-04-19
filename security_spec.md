# Security Specification - ReciBee

## Data Invariants
1. **Recipes:** Must have a valid title, ingredients, and steps. `user_id` must match the creator. `created_at` is immutable. `star_count` and `fork_count` are only incremented via atomic operations or admin actions.
2. **Users:** Public profiles (`uid`, `displayName`, `photoURL`, `bio`) are readable by all. Private data (`email`) is only readable by the owner.
3. **Stars:** Relation document `stars/{userId}_{recipeId}`. Must be created by the user specified in the ID.
4. **Feature Requests:** Users can create requests. `upvotes` can only be incremented if a `FeatureVote` document exists (existsAfter).

## The "Dirty Dozen" Payloads (Red Team Audit)

1.  **Identity Spoofing (Recipes):** 
    `{ "title": "Hacked", "user_id": "NOT_ME_UID", ... }` -> Should be rejected (user_id must match auth.uid).
2.  **State Shortcutting (Feature Requests):** 
    `{ "title": "New", "upvotes": 9999, ... }` -> Should be rejected (upvotes must start at 0 or match atomic vote).
3.  **PII Blanket Breach (Users):**
    `get(/users/PRIVATE_UID/private/data)` as anonymous -> Should be rejected.
4.  **Resource Poisoning (Long ID):**
    `create(/recipes/VERY_LONG_STRING_OVER_128_CHARS)` -> Should be rejected by `isValidId`.
5.  **Shadow Update (Sneaking Fields):**
    `update(/recipes/id, { "title": "New", "isAdmin": true })` -> Should be rejected by `hasOnly()` gate.
6.  **Immutable field breach (Recipes):**
    `update(/recipes/id, { "created_at": "2000-01-01" })` -> Should be rejected (created_at is immutable).
7.  **Email Spoofing (Admin check):**
    Payload from user with `email_verified: false` attempting admin read -> Should be rejected.
8.  **Query Trust Test (Scraping):**
    `collection('feature_votes').get()` without userId filter -> Should be rejected by `allow list`.
9.  **Terminal State Locking:**
    Attempting to update a "Finished" status (if applicable) -> Should be rejected.
10. **Timestamp Fraud:**
    `{ "updated_at": "2099-01-01" }` -> Should be rejected (must equal `request.time`).
11. **Type Poisoning:**
    `{ "ingredients": "Not an array" }` -> Should be rejected.
12. **Orphaned Writes:**
    Creating a Star for a recipe that doesn't exist -> Should be rejected by `exists()` check.
