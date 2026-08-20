Deshan Textile POS Pro - Auth/Staff Safety Patch

Changes:
- Prevent logged-in manager from changing own role.
- Prevent logged-in manager from deactivating own account.
- Prevent deactivating or demoting the last active manager in the UI.
- Existing staff create/edit/status flows are otherwise unchanged.

Verification completed:
- TypeScript: npx tsc -b --pretty false -> PASS

Apply:
1. Copy the frontend folder into the project root and Merge/Replace.
2. Run: cd frontend
3. Run: npm run build

Note:
These are frontend safety guards. Database/RLS enforcement should also be verified before final client handover.
