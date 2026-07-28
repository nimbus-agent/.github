# The Nimbus ecosystem

How the pieces fit together, and which repository owns what.

Nimbus is a **local-first AI agent framework**. Your machine holds the index and
makes the decisions; cloud services are connectors, never the system of record.
That single constraint shapes the whole ecosystem: there is one gateway that
owns your data, one contract that everything speaks, and a set of surfaces that
reach you where you already work.

## The shape

```text
                       ┌──────────────────────────────┐
                       │   YOUR MACHINE               │
   surfaces            │                              │      connectors
   ────────            │   ┌──────────────────────┐   │      ──────────
   VS Code    ─────┐   │   │  Nimbus Gateway      │   │  ┌── Google, Microsoft
   web clipper ────┼──►│   │  · private SQLite    │──►│──┼── GitHub, GitLab, Jira
   Raycast    ─────┤   │   │  · agent engine      │   │  ├── Slack, Notion, …
   CLI / TUI  ─────┘   │   │  · HITL consent gate │   │  └── ~80 services, MCP only
                       │   └──────────────────────┘   │
                       │        JSON-RPC 2.0 IPC      │
                       └──────────────────────────────┘
```

Everything a surface can do, it does by asking the gateway over local IPC. No
surface talks to a cloud service directly, and the gateway never calls a cloud
API except through an MCP connector.

## The contract flows one way — and licensing enforces it

This is the load-bearing architectural rule of the whole ecosystem:

| Package | License |
| --- | --- |
| `@nimbus-dev/sdk` — the contract | **MIT** |
| `@nimbus-dev/client` — the typed IPC client | **MIT** |
| `Nimbus` — the gateway | **AGPL-3.0** |

MIT code may flow into AGPL. The reverse would infect. **So shared types must
live in `nimbus-sdk` and be imported by the gateway — never the other way
around.** The licence choice is not decoration; it is what keeps the dependency
arrow pointing in the only direction that works.

## Repositories

### Core

| Repo | Role | License |
| --- | --- | --- |
| [`Nimbus`](https://github.com/nimbus-agent/Nimbus) | The gateway daemon, connectors, index, agents and the JSON-RPC surface | AGPL-3.0 |
| [`nimbus-sdk`](https://github.com/nimbus-agent/nimbus-sdk) | **The contract.** Dependency-free TypeScript types for authoring connectors and extensions | MIT |
| [`nimbus-client`](https://github.com/nimbus-agent/nimbus-client) | Typed JSON-RPC IPC client — the only supported path from a client to the gateway | MIT |

### Surfaces

Where the capability reaches a human.

| Repo | Role |
| --- | --- |
| [`nimbus-vscode`](https://github.com/nimbus-agent/nimbus-vscode) | VS Code / Open VSX extension — ask, search, chat participant, SCM tooling |
| [`nimbus-web-clipper`](https://github.com/nimbus-agent/nimbus-web-clipper) | Chrome + Firefox MV3 extension, over the gateway's paired HTTP surface |
| [`nimbus-raycast`](https://github.com/nimbus-agent/nimbus-raycast) | Raycast quick-ask (scaffold) |
| [`nimbus-statuspage`](https://github.com/nimbus-agent/nimbus-statuspage) | On-call and status pages from indexed incidents, alerts and DORA metrics (scaffold) |
| [`nimbus-postmortem`](https://github.com/nimbus-agent/nimbus-postmortem) | Incident postmortem drafts from indexed incidents, deploys and implicated changes (scaffold) |

The CLI and TUI ship inside the `Nimbus` repo rather than separately.

Surfaces marked *(scaffold)* hold a vision README and a build prompt but no
implementation yet. They are sequenced in the gateway's
[roadmap](https://github.com/nimbus-agent/Nimbus/blob/main/docs/roadmap.md), not
here — this document says what exists, not what happens next.

### Connectors and extensions

| Repo | Role |
| --- | --- |
| `create-nimbus-connector` | Scaffolding generator for first-party-style MCP connectors |
| `nimbus-mcp-servers` | Standalone MCP servers derived from Nimbus connectors, usable by any MCP client |
| `nimbus-connector-registry` | Signed index and publisher-key directory for the connector marketplace |
| `nimbus-recipes` | Community hub for shareable, signed recipes (`.nimbus-recipe.yaml`) |
| [`awesome-nimbus`](https://github.com/nimbus-agent/awesome-nimbus) | Curated list of connectors, recipes, extensions and resources |

### Distribution

| Repo | Role |
| --- | --- |
| [`homebrew-tap`](https://github.com/nimbus-agent/homebrew-tap) | Homebrew tap (macOS / Linux) |
| [`scoop-bucket`](https://github.com/nimbus-agent/scoop-bucket) | Scoop bucket (Windows) |
| [`linux-repo`](https://github.com/nimbus-agent/linux-repo) | GPG-signed apt/yum repository, published per stable release |

Windows also ships through winget; installers are built in the `Nimbus` repo.

### Project infrastructure

| Repo | Role |
| --- | --- |
| [`.github`](https://github.com/nimbus-agent/.github) | Org profile, shared community-health defaults, CLA, this document |
| [`nimbus-security`](https://github.com/nimbus-agent/nimbus-security) | Public security model, invariant catalogue, vulnerability disclosure |
| [`nimbus-benchmarks`](https://github.com/nimbus-agent/nimbus-benchmarks) | Public performance benchmarks and trend dashboards |

## Where planning lives

Each document owns exactly one question. If two disagree, the one whose question
it is wins.

| Question | Owner |
| --- | --- |
| What the gateway does, and which surfaces come next | [`Nimbus/docs/roadmap.md`](https://github.com/nimbus-agent/Nimbus/blob/main/docs/roadmap.md) |
| How it gets built, reviewed and shipped | [`Nimbus/docs/infrastructure-roadmap.md`](https://github.com/nimbus-agent/Nimbus/blob/main/docs/infrastructure-roadmap.md) |
| Which RPCs the client exposes — the *width* of the client surface | [`nimbus-client/ROADMAP.md`](https://github.com/nimbus-agent/nimbus-client/blob/main/ROADMAP.md) |
| The authoring contract and its versioning | [`nimbus-sdk/docs/ROADMAP.md`](https://github.com/nimbus-agent/nimbus-sdk/blob/main/docs/ROADMAP.md) |
| Any one surface's own detail | that surface's own `ROADMAP.md` |
| How the ecosystem fits together | **this document** |

There is deliberately no separate cross-surface roadmap. Sequencing — *which*
surface should exist next and why that one first — is a product question and
belongs in the gateway's roadmap alongside everything else it sequences. A
second sequencing document only creates two files claiming the same authority.

## Non-negotiables

These hold across every repository in the ecosystem. They are architectural
constraints, not preferences:

1. **Local-first** — the machine is the source of truth; the cloud is a connector.
2. **Human-in-the-loop is structural** — the consent gate lives in the execution
   engine, not in a prompt. It cannot be bypassed or configured away.
3. **No plaintext credentials** — secrets live only in the OS vault (Windows
   DPAPI / macOS Keychain / Linux libsecret). Never in logs, IPC or config.
4. **MCP as the connector standard** — the engine never calls a cloud API directly.
5. **Platform equality** — Windows, macOS and Linux are equally supported; CI
   gates on all three.
6. **AGPL-3.0 core, MIT SDK** — the dual licence is intentional and directional.

## Contributing

Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md). Contributions require signing the CLA;
the bot will guide you on your first pull request.

To report a vulnerability, see [`SECURITY.md`](./SECURITY.md) — use GitHub
private vulnerability reporting on the affected repository.
