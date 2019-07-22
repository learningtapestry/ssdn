# Secure Student Data Network (SSDN)

Open source application that provides a non-proprietary, vendor-neutral solution for facilitating
data interchange between public school districts and education technology providers.

This is the root project for the Secure Student Data Network. Head to the corresponding sub-project README to know
more.

- [SSDN Core](packages/core#readme)
- [SSDN Administration Panel](packages/admin#readme)
- [SSDN Browser Collection Agent](packages/collection-agent#readme)
- [SSDN CLI (installation and upgrade)](packages/cli#readme)

## Additional documentation

- [Architecture design](docs/architecture-design.md)
- [Testing methodology](docs/testing-methodology.md)
- [Security considerations](docs/security-considerations.md)

## Setup

The root project uses [Yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and
[Lerna](https://lerna.js.org/) to manage its sub-projects.

You can setup every sub-project individually by following the instructions given in the
corresponding README, or you can bootstrap all of them at once by running:

```bash
lerna bootstrap
```

or

```bash
yarn install
```

Other useful commands you can run on all sub-projects at once are:

```bash
yarn build          # generates a production-ready bundle
yarn start          # starts a live-reloading development environment
yarn lint           # runs typescript linter (ts-lint)
yarn check-types    # runs typescript compiler (tsc)
```
