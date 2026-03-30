# Security Hardening Runbook

## 1) Rotate Secrets (Immediate)
1. Rotate Firebase service account key.
2. Rotate reCAPTCHA secret keys.
3. Remove old or unused keys from provider dashboards.

## 2) Configure Backend Env
Set these values in deployment secrets:
- `FIREBASE_SERVICE_ACCOUNT` (JSON string) or secure mounted credential path
- `ADMIN_UIDS` (comma-separated Firebase UIDs)
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_READ_MAX`
- `RATE_LIMIT_WRITE_MAX`
- `RATE_LIMIT_BUCKET_MAX_KEYS`

## 3) Deploy Firestore Rules
1. Install Firebase CLI.
2. Authenticate with project owner account.
3. Run: `firebase deploy --only firestore:rules`

## 4) Enable CI Checks
Ensure GitHub Actions is enabled and required for merges:
- `.github/workflows/ci-security.yml`

## 5) Verify Protected Endpoints
Authenticated token required for:
- `GET /api/v1/library/{user_id}` (must match token UID)
- `POST /api/v1/library/like`
- `POST /api/v1/library/playlist`
- `GET /api/v1/recommend/{user_id}` (must match token UID)
- `POST /api/v1/interactions/track`
- `POST /api/v1/interactions/sync` (admin UIDs only)

## 6) Post-Deploy Smoke Test
1. Manual/CLI option:
   - `python backend/scripts/post_deploy_smoke.py --base-url <api-url> --probe-user <uid> --forbidden-user <other-uid> --token <bearer-token>`
2. GitHub Actions option:
   - Run `.github/workflows/post-deploy-smoke.yml` with `api_base_url`, `probe_user_id`, and `forbidden_user_id`.
3. Store `dev_reports/post_deploy_smoke_report.json` as deployment evidence.

## 7) Automated Baseline Verification
1. CI mode: `python backend/scripts/security_verify.py --ci`
2. Deploy mode: `python backend/scripts/security_verify.py --deploy`
3. Treat any failure as a release blocker.

## 8) Recommendation Registry Gating
1. Register artifacts:
   `python recommendation_engine/register_model.py --model-id <id> --set-active`
2. Validate active model:
   `python recommendation_engine/evaluate_registry.py --min-users 1 --min-songs 1`
3. Optional strict dataset-size enforcement:
   `python recommendation_engine/evaluate_registry.py --min-users 1 --min-songs 1 --strict-dataset-match`
4. Use `dev_reports/recommendation_registry_eval.json` as deployment evidence.

## 9) Runtime Compatibility Guard
1. Keep `numpy<2` pinned in both requirement files.
2. Ensure deployment image installs from those pinned files.
3. Use `security_verify.py` to fail when runtime NumPy major version is `>=2`.

## 10) Stabilization Window (First 24 Hours)
1. Check `/health`, `/ready`, `/metrics`, `/metrics/prometheus` every 15 minutes.
2. Watch auth failure and rate-limit counters for unexpected spikes.
3. Capture a final stabilization summary in `dev_reports` before declaring rollout complete.

## 11) Current Rollout Status
- Completed in repo: phases 1 through 10 implementation and automation.
- Completed in environment: NumPy runtime aligned to `1.26.4`; security and registry checks pass.
- External execution pending: run post-deploy smoke workflow against production URL after deployment.
