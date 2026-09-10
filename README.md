<p align="center">
  <a href="https://www.thewizardnexus.com/">
    <img src="assets/wizard-nexus-banner.png" width="100%" alt="Many roads. One mission. Hard systems. Human stakes.">
  </a>
</p>
<h3 align="center">Human-centered systems for earlier, accountable action.</h3>

<p align="center">
  <a href="https://www.thewizardnexus.com/"><img alt="Website" src="https://img.shields.io/badge/Website-TheWizardNexus.com-169DDA?style=for-the-badge"></a>
  <a href="https://github.com/TheWizardNexus"><img alt="TWiN on GitHub" src="https://img.shields.io/badge/GitHub-TheWizardNexus-0B2038?style=for-the-badge&logo=github&logoColor=white"></a>
  <a href="https://www.thewizardnexus.com/contact.html"><img alt="Contact The Wizard Nexus" src="https://img.shields.io/badge/Contact-The_dojo_is_open-F0C050?style=for-the-badge"></a>
</p>

<p align="center">
  <a href="https://www.thewizardnexus.com/signal.html">
    <img src="assets/twin-signal.svg" width="100%" alt="The Wizard Nexus public signal showing project, ecosystem, repository, and package telemetry">
  </a>
</p>

<!-- profile-telemetry-counts:start -->
<p align="center">
  <strong>16 published project sites · 78 mapped ecosystem points · 171 relationships · 7 public repositories</strong><br>
  <sub><strong>152 official npm range downloads</strong> from January 1, 2026 through September 6, 2026 · npm-stat is an optional comparison only</sub><br>
  <a href="https://www.thewizardnexus.com/technology.html"><strong>Navigate the live TWiN technology directory →</strong></a>
</p>
<!-- profile-telemetry-counts:end -->

<p align="center">
  <a href="https://www.thewizardnexus.com/technology.html">Technology</a> ·
  <a href="https://www.thewizardnexus.com/ecosystem.html">Ecosystem</a> ·
  <a href="https://www.thewizardnexus.com/practice.html">Practice</a> ·
  <a href="https://kempo.thewizardnexus.com/philosophy.html">Philosophy</a> ·
  <a href="https://www.thewizardnexus.com/trust.html">Trust</a> ·
  <a href="https://www.thewizardnexus.com/people.html">People</a> ·
  <a href="https://zen-sentry-foundation.thewizardnexus.com/">Zen Sentry</a> ·
  <a href="https://www.thewizardnexus.com/work.html">Services</a> ·
  <a href="https://www.thewizardnexus.com/contact.html">Contact</a>
</p>

## The mission

The Wizard Nexus connects behavioral-health practice, governed AI, local-first technology, and evidence-centered workflows so trusted people can understand emerging risk and act earlier.

At its center is **PreCrisis AI**: technology designed to help people recognize signs of trouble early enough for meaningful human intervention. Across every system, TWiN puts life and dignity first, preserves human agency, and keeps source boundaries, maturity, privacy, evidence, accountability, and repair visible.

> **Optimize → Detect → Prevent → Intervene**

TWiN is a **woman-led, Veteran-founded, clinically informed team** founded by **Johanna “JZ” Zollmann, LCSW**, a former U.S. Army Behavioral Health Officer, alongside **Roshi**, a U.S. Air Force Veteran and deep-tech builder.

## Technology and public source

The [Technology directory](https://www.thewizardnexus.com/technology.html) links the public project sites across four pathways and renders project-owned header art, a project-specific commissioned banner, or—where neither is available—the project’s GitHub repository card. A repository link appears only where the source repository is public.

- [The Wizard Nexus on GitHub](https://github.com/TheWizardNexus)
- [Roshi on GitHub](https://github.com/RIAEvangelist)
- [Complete public source atlas](https://www.thewizardnexus.com/code.html)
- [Measured public signal](https://www.thewizardnexus.com/signal.html)
- [Dated LinkedIn signal](https://www.thewizardnexus.com/linkedin-signal.html)

A public interface does not automatically mean public source, production readiness, clinical validation, or authorization for consequential use. The site labels those boundaries directly.

## Practice, foundation, and services

- [Practice](https://www.thewizardnexus.com/practice.html) — PreCrisis, KEMPO, and the disciplines behind earlier action.
- [Philosophy](https://www.thewizardnexus.com/philosophy.html) — KEMPO, Life First, and the moral commitments governing consequential work.
- [KEMPO philosophy](https://kempo.thewizardnexus.com/philosophy.html) — the full public philosophy of practiced judgment under pressure.
- [Life First Framework](https://life-first-framework.thewizardnexus.com/) — an open working framework for life, dignity, agency, accountability, and repair ([repository](https://github.com/RIAEvangelist/life-first-framework)).
- [Trust](https://www.thewizardnexus.com/trust.html) — accountable decisions, evidence, privacy, maturity, source boundaries, and repair.
- [Zen Sentry Foundation](https://zen-sentry-foundation.thewizardnexus.com/) — research, tools, partnerships, and community initiatives for protection before crisis ([repository](https://github.com/TheWizardNexus/Zen-Sentry-Foundation)).
- [Services](https://www.thewizardnexus.com/work.html) — seven focused paths with clear one-time service-hour pricing, adjustable 1–20 hour checkout, and a discuss-pricing route.

## People

- [Johanna “JZ” Zollmann on LinkedIn](https://www.linkedin.com/in/johannazollmann/)
- [Roshi on LinkedIn](https://www.linkedin.com/in/turtlesallthewaydown/)
- [Roshi on GitHub](https://github.com/RIAEvangelist)
- [Roshi’s website](https://riaevangelist.github.io/RIAEvangelist/)
- [Meet the team](https://www.thewizardnexus.com/people.html)

## This repository

This repository is the plain HTML, CSS, and JavaScript source for **TheWizardNexus.com**, using **Arcane SDK 0.31.0** for its shared runtime, theme, installation, offline pages, DBOPFS storage, and mail integration. It publishes the selected browser package to GitHub Pages from `main` through [the Pages workflow](.github/workflows/profile-site.yml). The public, one-time Stripe service-hour catalog is recorded in [`data/service-products.json`](data/service-products.json); it contains public product, price, and Payment Link identifiers only—never secret keys.

Use Node.js 22.23.2 or newer. From this repository, install the exact committed dependency tree and start the local site:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm start
```

Open [localhost:8080](http://localhost:8080). This development command uses the Arcane SDK's HTTP mode on localhost, where browsers provide the secure context needed for local storage and service workers. `npm run dev` selects the SDK's HTTPS development mode and requires the local certificate configuration described in the [Arcane SDK documentation](https://arcane-os-sdk.thewizardnexus.com/).

This application lives directly at its repository root. Keep your existing server pointed at this checkout. The SDK-generated `arcane.webmanifest`, `arcane-pwa.mjs`, `arcane-sw.js`, and `arcane-offline.json` are committed alongside the pages, so pulling the repository supplies the offline files. The SDK is supplied by its installed `node_modules/arcane-os` paths. Keep application files at the repository root, with no root `arcane/` or internal `apps/<appname>/` directory and no redirects recreating those paths. Install the exact SDK dependency tree on initial setup and when the committed dependency changes:

```sh
npm ci --ignore-scripts --no-audit --no-fund
```

Serving this checkout requires no build or preparation command. Maintainers refresh the committed SDK-generated files through `npm run prepare:site` when changing the SDK, page inventory, or application descriptor, and include that output in the same commit. This uses the SDK's public generator and packager once to prepare relative URLs that work at both the domain root and a subdirectory. Generated files remain owned by the SDK generator and must not be hand-edited.

GitHub Actions installs the pinned runtime, refreshes public telemetry, and runs the configured source checks. After synchronizing its snapshot commit, it copies the files listed in the committed `ARCANE_APP_RELEASE.json` into `output/pages` once, checks that upload, and deploys it. It does not regenerate the repository or run the SDK packager. The copy preserves an optional root `CNAME`.

For an optional separate static export, `npm run build` packages the prepared website and its selected SDK runtime into `dist/wizard-nexus`, including an optional root `CNAME`. The authored [`arcane-app.json`](arcane-app.json) selects the public content; [`arcane-packager.json`](arcane-packager.json) keeps this application at the repository root. When using that export, copy its complete contents, including its `node_modules` directory, to the selected document root.

Visit the site online first and let its offline preparation finish before disconnecting. A browser that supports installation can add The Wizard Nexus through its install menu. Offline operation requires service workers and origin-private storage on HTTPS or localhost; opening the HTML directly from the filesystem does not provide that environment. The installed site retains its packaged pages, assets, and public data snapshots. External websites, live purchases, updates, and sending contact email require a connection.

The contact form sends to `connect+website@thewizardnexus.com`. Mail uses `The Wizard Nexus website <twin@mail.precrisis.ai>` as its gateway sender and the visitor's email as `Reply-To`; the subject and message are sent as authored. Drafts are saved locally in DBOPFS and can be written offline. Sending begins only when the visitor submits while connected.

DBOPFS also stores the contact ledger in the current browser: at least 15 minutes between submissions and at most 3 in any rolling 24 hours. Accepted messages are counted, and pending or unconfirmed deliveries reserve an allowance to avoid duplicates after a lost response. An explicit service rejection restores that allowance. The form shows accepted counts, remaining allowance, and the next available send time. These limits belong to this browser's local storage; another browser or cleared site data has separate state. Delivery is reported as accepted only after the mail provider confirms acceptance.

<p align="center">
  <strong>The dojo is open.</strong><br>
  <a href="https://www.thewizardnexus.com/contact.html">Start a conversation →</a>
</p>
