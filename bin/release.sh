#!/usr/bin/env bash

VERSION=$(node -p "require('./lerna.json').version")

ROOT_DIR=$(pwd)
RELEASE_PATH="releases/ssdn-${VERSION}"

setup_release () {
  rm -rf ${RELEASE_PATH}
  rm -rf ${RELEASE_PATH}.zip
  mkdir -p ${RELEASE_PATH}/packages/core
  mkdir -p ${RELEASE_PATH}/packages/admin
  mkdir -p ${RELEASE_PATH}/packages/cli
}

build_core () {
  cp -r packages/core/dist \
        packages/core/template.yaml \
        ${RELEASE_PATH}/packages/core
}

build_admin_panel () {
  cp -r packages/admin/amplify \
        packages/admin/public \
        packages/admin/src \
        packages/admin/package.json \
        packages/admin/tsconfig.json \
        ${RELEASE_PATH}/packages/admin
  cd ${RELEASE_PATH}/packages/admin
  find src -maxdepth 3 -type f \( -name "*.test.tsx" -o -name "*.test.ts" \) -delete
  rm -rf src/aws-exports.js \
         src/setupTests.ts \
         amplify/#current-cloud-backend \
         amplify/.config/local-* \
         amplify/backend/awscloudformation \
         amplify/backend/amplify-meta.json \
         amplify/team-provider-info.json
  cd "${ROOT_DIR}"
}

build_cli () {
  cp -r packages/cli/dist ${RELEASE_PATH}/packages/cli
}

copy_extra () {
  mkdir ${RELEASE_PATH}/bin
  cp -r bin/ssdn ${RELEASE_PATH}/bin
  cp package.json ${RELEASE_PATH}
  cp lerna.json ${RELEASE_PATH}
  cp yarn.lock ${RELEASE_PATH}
}

cleanup_release () {
  (cd ${RELEASE_PATH} && zip -r ../ssdn-${VERSION}.zip .)
  rm -rf ${RELEASE_PATH}
}

# Main script
setup_release
build_core
build_admin_panel
build_cli
copy_extra
cleanup_release
echo "Generated release in ${RELEASE_PATH}.zip"

