# Aimeetly

## Tech Stack
- `Next.js`—The React Framework for the Web
- `Orpc`—Typesafe APIs Made Simple
- `TailwindCSS`—utility-first CSS framework
- `Shadcn UI`—A set of beautifully designed components that you can customize, extend, and build on
- `Drizzle ORM`—Object–relational mapping for typescript/javascript
- `Biome`—Format, lint, and more in a fraction of a second
- `Devbox`—Portable, Isolated Dev Environments on any Machine
- `Better Auth`—The most comprehensive authentication framework for TypeScript.
- `Bun`—Bun is a fast, incrementally adoptable all-in-one JavaScript, TypeScript & JSX toolkit.
- `Zod`—TypeScript-first schema validation with static type inference
- `Turborepo`—Build system for JavaScript and TypeScript codebases
- `PostgreSQL`—The World's Most Advanced Open Source Relational Database
- `Neon`—The database developers trust, on a serverless platform designed to help you build reliable and scalable applications faster.
- `TanStack Query`—Powerful asynchronous state management, server-state utilities, and data fetching
- `Pino`—Superfast, all natural JSON logger for Node.js
- `Expo`—Is a full-stack React Native framework
- `Devbox`—Creates isolated, reproducible development environments that run anywhere. No Docker containers or Nix lang required
- `Traefik`—is a modern HTTP reverse proxy and load balancer that makes deploying microservices easy
- `Sops`—Simple and flexible tool for managing secrets
- `Uniwind`—The Fastest Tailwind bindings for React Native

## Getting Started

- Runtime: Bun
- Package Manager: Bun
- Development Environment: Devbox

#### PS: When running custom script, make sure you are in the project root directory

## Init local
- Open the terminal, install the devbox if not yet installed:
```bash
curl -fsSL https://get.jetify.com/devbox | bash
```

## Set up as a new project
- Same terminal or new terminal and go to the project root

```bash
cd <project-root>

## install devbox
devbox install

## close the terminal and open a new one
## if direnv is not yet allowed run
direnv allow

## run the env-decrypt script
env-decrypt

# Rename all instances of `aimeetly` to your project name
# then proceed to Getting Started

## run the init-local script
init-local
```

- Run the migration:
```bash
## op the other terminal
## if you have new changes in the `shared/rpc/src/db/schemas/*.ts` file
## or no generated folder yet in the `shared/rpc/src/db/generated`

## run the generate and migration
bun db:generate
# then
bun db:migrate

## else, just run the migration
bun db:migrate
```

## Init local manually
- Open the terminal, install the devbox if not yet installed:
```bash
curl -fsSL https://get.jetify.com/devbox | bash
```

## Set up as a new project
- Same terminal or new terminal and go to the project root

```bash
cd <project-root>

## install devbox
devbox install

## close the terminal and open a new one
## if direnv is not yet allowed run
direnv allow

## run the env-decrypt script
env-decrypt

# Rename all instances of `aimeetly` to your project name
# then proceed to Getting Started
```

- Install dependencies:
```bash
bun install
# or
bun i
```

- Generate cert file
```bash
cert-gen
```

- Sync env
```aiignore
## run env-decrypt script 
## it will decrypt and create a file in `tools/secrets/apps.local.yaml`
env-decrypt

## then run env-sync script
## it will create .env file to the designated directory
env-sync

## if you have new changes in the `tools/secrets/apps.local.yaml` file

## run the env-encrypt script
env-encrypt

## then push the changes to the repo
## so that the encrypted file can be used by other developers
```

- Sync hosts
```bash
sync-hosts
```

- Run the development services:
```bash
dev up
```


- Run the migration:
```bash
## op the other terminal
## if you have new changes in the `shared/rpc/src/db/schemas/*.ts` file
## or no generated folder yet in the `shared/rpc/src/db/generated`

## run the generate and migration
bun db:generate
# then
bun db:migrate

## else, just run the migration
bun db:migrate
```

## Reset your local
```bash
## Open terminal and go to the project root
## run the following commands
reset-local

## on the other terminal
## if you have new changes in the `shared/rpc/src/db/schemas/*.ts` file
## or no generated folder yet in the `shared/rpc/src/db/generated`

## run the generate and migration
bun db:generate
# then
bun db:migrate

## else, just run the migration
bun db:migrate
```

## View logs of the running services
```bash
## more info of running services is in `process-compose.yaml`
dev logs <service-name>

## example
dev logs server
```

## Access services

To access the web app, navigate to [https://app.aimeetly.dev](https://app.aimeetly.dev) with your browser.

By default, the core, docs, server, and site are disabled. To enable it, run:
```bash
# or
dev start core
# or 
dev start docs
# or 
dev start server
# or 
dev start site
```

To access the development server swagger, navigate to [https://server.aimeetly.dev/api](https://server.aimeetly.dev/api) with your browser.

To access the site, navigate to [https://aimeetly.dev](https://aimeetly.dev) with your browser.

To access the core, navigate to [https://core.aimeetly.dev](https://core.aimeetly.dev) with your browser.

## Run mobile on your mobile device
- update the .env file with your local IP address
- Go to apps/mobile and open .env file
- Change the value of `EXPO_PUBLIC_SERVER_URL=http://<replace-with-your-ip>:3003` to your local IP address
- Once done, proceed to install Expo app on your mobile device [https://expo.dev/go](https://expo.dev/go)
- Go back to your terminal and run the following command
```bash
cd <project-root>

dev up mobile
# after running the command, scan the QR code
```

## Add a package to the project
```bash
cd <package-path-folder>
bun add <package-name>

## example
bun add pg

## or use the custom script
bunadd pg <package-path-folder>

## example
bunadd pg apps/server
```

## Add a dev package to the project
```bash
cd <package-path-folder>
bun add -D <package-name>

## example
bun add -D pg

## or use the custom script
bundevadd pg <package-path-folder>

## example
bundevadd pg apps/server
```

## Remove a package from the project
```bash
cd <package-path-folder>
bun rm <package-name>

## example
cd apps/server
bun rm pg

## or use the custom script
bunrm pg <package-path-folder>

## example
bunrm pg apps/server
```

## Check an outdated package
```bash
bun outdated -r
```

## Update outdated package
```bash
bun update --interactive --recursive
# or
bun update -i -r
```

## Add shadcn ui components to the project
```bash
cd <project-root>

uiadd <component-name> <package-path-folder>

## example
uiadd button apps/web
```

## Folder Structures
- `apps`—contains all the apps
  - `core`—web admin panel
  - `docs`—web documentation
  - `mobile`—mobile app
  - `server`—api server for mobile app
  - `site`—landing page
  - `web`—web app
- `shared`—contains shared code between apps
  - `rpc`—shared Remote Procedure Call
    - `src`—entry point for RPC
      - `repositories`—database repositories
      - `routers`—RPC routers
      - `services`—RPC services
  - `web-ui`—shared UI components for web apps
- `tools`—contains scripts and configs
  - `certs`—certificates files
  - `nix`-nix files
    - `scripts`—scripts for local development
  - `secrets`—sops secrets files
  - `traefik`—traefik configs