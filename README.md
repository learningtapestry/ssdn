# Nucleus

This is the root project for Amazon Nucleus. Head to the corresponding sub-project README to know
more:

- [Nucleus Core](packages/core#readme)
- [Nucleus Administration Panel](packages/admin#readme)

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
