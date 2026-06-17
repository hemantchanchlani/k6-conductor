# Contributing to k6-conductor

Thanks for taking the time to contribute! Here's how to get started.

---

## Ways to contribute

- **Add a sample app config** — add a real-world service example under `config/apps/`
- **Improve the README** — better examples, clearer explanations
- **Report a bug** — open a GitHub Issue with steps to reproduce
- **Request a feature** — open a GitHub Issue describing your use case
- **Fix a bug or add a feature** — open a Pull Request

---

## Getting started

```bash
git clone https://github.com/hemantchanchlani/k6-conductor.git
cd k6-conductor
```

Install k6 if you haven't already: https://k6.io/docs/get-started/installation/

Run the sample test:

```bash
k6 run -e TEST_TYPE=dryrun -e APPS=user-service main.js
```

---

## Pull request guidelines

- Keep changes focused — one feature or fix per PR
- Update the README if you add or change any configuration options
- Test your changes with `k6 run -e TEST_TYPE=dryrun main.js` before submitting
- Use a clear PR title: `feat: ...`, `fix: ...`, `docs: ...`

---

## Adding a sample service config

The most valuable contributions are real-world app configs showing how to model
different API patterns (pagination, auth flows, file uploads, etc.).

To add one:

1. Create `config/apps/<your-service>.json` following the existing examples
2. Add sample CSV files under `data/` if needed
3. Add your service name to the `apps` array in `config/global.json`
4. Open a PR with a short description of what the service models

---

## Reporting bugs

Open a GitHub Issue and include:

- k6 version (`k6 version`)
- Your `config/` files (redact any credentials)
- The exact command you ran
- The error output
