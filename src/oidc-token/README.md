# OAuth token proxy (`/oidc/token`)

`POST /oidc/token` (plus `OPTIONS` preflight) forwards form-encoded token requests to
`https://trmnl.com/oidc/token` and adds CORS headers, because TRMNL's token endpoint does not send them.
The [Holiday Editor](https://blueset.github.io/trmnl-recipes/holiday-editor/) uses it for its OAuth PKCE sign-in.

- It is stateless and holds no secrets, because the editor is a public client. It accepts only the `authorization_code` and `refresh_token` grants and rejects requests that include a `client_secret`.
- It accepts calls only from origins listed in `OIDC_PROXY_ALLOWED_ORIGINS`. When `OIDC_PROXY_ALLOW_LOCALHOST` is `"true"`, it also accepts any `http://localhost` or `http://127.0.0.1` port.
- `OIDC_PROXY_ALLOWED_CLIENT_IDS` can pin the proxy to specific OAuth client IDs.
