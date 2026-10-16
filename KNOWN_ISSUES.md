# Known issues

Bugs identified while building the project. The first two were found by the automated tests and are already corrected. The rest are known and were left as they are on purpose, with the reason.

## Fixed during development

| Issue | How it was found | Fix |
|---|---|---|
| `GET /api/v1/products` without the `inStockOnly` parameter returned 400, because a primitive `boolean` could not be bound to a missing value | Integration test of the search, which ran without that filter | `inStockOnly` is a `Boolean` and `null` means `false`. A controller test now covers a search without filters |
| The search box could erase what the user had just typed: the URL updates asynchronously and its echo overwrote the local text | Unit test of the debounce hook | The hook tells apart an external change (clear filters, back button) from the echo of the user's own typing |

## Open

| Issue | Impact | Why it was left |
|---|---|---|
| Deleting a product that is part of an order returns 409 with a generic message from the API ("modified concurrently or violates a constraint"). The web app shows a specific message, the API does not | Low: the delete is correctly rejected | A dedicated error for foreign key violations would be the fix. Left out to keep the scope of the challenge |
| Two simultaneous imports of the same new SKU can make one of them fail with 409, because the whole import is a single transaction and the SKU is unique | Low: the import can be repeated and is idempotent | Handling it would need a retry or a per row savepoint |
| Prices with more than two decimals and weights with more than three are rounded without notice when importing | Low: the example file has none | The rounding is documented here instead of rejecting the row. A warning in the report would be better |
