# SSDN

Open source application that provides a non-proprietary, vendor-neutral solution for facilitating
data interchange between educational institutions and education technology providers.

This is the root project for the SSDN. Head to the corresponding sub-project README to know
more.

- [SSDN Core](packages/core#readme)
- [SSDN Administration Panel](packages/admin#readme)
- [SSDN Browser Collection Agent](packages/collection-agent#readme)
- [SSDN CLI (installation and upgrade)](packages/cli#readme)

## Additional documentation

- [API usage](docs/api-usage.md)
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
yarn release        # generates a new release in a .zip file and stores it in `/releases`
```

## Creating a new release

Since the main project is managed by Lerna, you can use one of its commands to update all the sub-packages at the same
time. For example, to bump the project to version `1.2.3`, you can run:

```bash
lerna version 1.2.3
```

Keep in mind that, by default, this command will commit the changes, generate a version tag and push everything to the
repository. If you don't want that, check out Lerna's documentation to know more about its different options.

After the version is set, you can then run:

```bash
yarn release
```

This will generate a file named `ssdn-1.2.3.zip` in the `releases` folder that is suitable for installation. Check out 
the [installation instructions](https://github.com/awslabs/secure-student-data-network/tree/master/packages/cli#installation-instructions)
for more details.
