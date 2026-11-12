# The Nimbus ecosystem

How the pieces fit together, and which repository owns what.

Nimbus is a **local-first AI agent framework**. Your machine holds the index and
makes the decisions; cloud services are connectors, never the system of record.
That single constraint shapes the whole ecosystem: there is one gateway that
owns your data, one contract that everything speaks, and a set of surfaces that
reach you where you already work.

Where this is heading is recorded in the gateway's roadmap,
[§ Direction](https://github.com/nimbus-agent/Nimbus/blob/main/docs/roadmap.md#direction):
Nimbus as the trust layer between AI agents and engineering systems. That is a
planned direction; this document describes what exists.

## The shape

```text
                       ┌──────────────────────────────┐
                       │   YOUR MACHINE               │
   surfaces            │                              │      connectors
   ────────            │   ┌──────────────────────┐   │      ──────────
   VS Code    ─────┐   │   │  Nimbus Gateway      │   │  ┌── Google, Microsoft
   web clipper ────┼──►│   │  · private SQLite    │──►│──┼── GitHub, GitLab, Jira
   MCP clients ────┤   │   │  · agent engine      │   │  ├── Slack, Notion, …
   CLI / TUI  ─────┘   │   │  · HITL consent gate │   │  └── about 95 services, MCP only
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
| [`nimbus-sdk`](https://github.com/nimbus-agent/nimbus-sdk) | **The contract.** A language-neutral authoring contract for connectors and extensions, with TypeScript, Python and Go bindings | MIT |
| [`nimbus-client`](https://github.com/nimbus-agent/nimbus-client) | Typed JSON-RPC IPC client — the only supported path from a client to the gateway | MIT |

### Surfaces

Where the capability reaches a human.

| Repo | Role |
| --- | --- |
| [`nimbus-vscode`](https://github.com/nimbus-agent/nimbus-vscode) | VS Code / Open VSX extension — ask, search, chat participant, SCM tooling |
| [`nimbus-web-clipper`](https://github.com/nimbus-agent/nimbus-web-clipper) | Chrome + Firefox MV3 extension, over the gateway's paired HTTP surface |
| [`nimbus-mcp`](https://github.com/nimbus-agent/nimbus-mcp) | Launcher for the Nimbus MCP server: gives any MCP client your local index and the built-in agents |

The CLI and TUI ship inside the `Nimbus` repo rather than separately.

Which surface comes next is decided in the gateway's
[roadmap](https://github.com/nimbus-agent/Nimbus/blob/main/docs/roadmap.md), not
here — this document says what exists, not what happens next.

### Connectors and extensions

| Repo | Role |
| --- | --- |
| `create-nimbus-connector` | Scaffolding generator for first-party-style MCP connectors |
| [`nimbus-mcp-servers`](https://github.com/nimbus-agent/nimbus-mcp-servers) | The first-party connectors, published as one package; each also runs standalone for any MCP client. Run standalone, a connector has no gateway around it: no vault, no sandbox and no egress ledger. That repository's `NOTICE` says exactly what it keeps |
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
| [`nimbus-trust`](https://github.com/nimbus-agent/nimbus-trust) | The signed trust feed every install applies: key revocations, takedowns and verified publishers |

### Retired

Five repositories held only a vision and a build prompt, and were retired on
2026-11-12. Each row says where its work went.

| Repo | What happened |
| --- | --- |
| `nimbus-statuspage` | Became a gateway row: the status page draft, [Phase 17](https://github.com/nimbus-agent/Nimbus/blob/main/docs/roadmap.md#phase-17--the-on-call-copilot) |
| `nimbus-postmortem` | Became the gateway's post-mortem rows, [Phase 10](https://github.com/nimbus-agent/Nimbus/blob/main/docs/roadmap.md#phase-10--the-autonomous-agent) and Phase 17 |
| `nimbus-connector-registry` | The registry shipped inside the gateway instead, [Phase 9.5](https://github.com/nimbus-agent/Nimbus/blob/main/docs/roadmap.md#phase-95--marketplace-registry) |
| `nimbus-raycast` | Not planned; see [Rejected Directions](https://github.com/nimbus-agent/Nimbus/blob/main/docs/roadmap.md#rejected-directions) |
| `nimbus-recipes` | Not planned as a gallery; recipes remain a share kind in the gateway. See [Rejected Directions](https://github.com/nimbus-agent/Nimbus/blob/main/docs/roadmap.md#rejected-directions) |

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

These hold for the gateway and for everything that runs through it, in every
repository. They are architectural constraints, not preferences. One limit is
stated plainly: a connector run standalone, outside the gateway, takes its
credentials from the environment or the MCP client's configuration and has no
vault, sandbox or ledger around it (see `nimbus-mcp-servers`' `NOTICE`).

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
