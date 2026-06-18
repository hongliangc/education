import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const publishScript = "scripts/publish-image.sh";
const deployScript = "scripts/deploy.sh";
const releaseScript = "scripts/release.sh";
const deployStackScript = "scripts/deploy-stack.sh";

test("publish script builds and pushes versioned and latest Docker Hub tags", () => {
  const script = fs.readFileSync(publishScript, "utf8");

  assert.match(script, /DOCKER_IMAGE.*hlc2012\/mlk/);
  assert.match(script, /DOCKER_CMD.*docker/);
  assert.match(script, /buildx build/);
  assert.match(script, /--platform linux\/amd64/);
  assert.match(script, /--push/);
  assert.match(script, /:latest/);
});

test("deploy script is one path for local and prod, only values differ", () => {
  const script = fs.readFileSync(deployScript, "utf8");

  // 同一个 deploy.sh 接受 local/prod，渲染同一组键、跑同一个 deploy-stack.sh。
  assert.match(script, /Usage: bash scripts\/deploy\.sh \{local\|prod\}/);
  assert.match(script, /local\|--local/);
  assert.match(script, /prod\|production\|--prod\|--production/);
  assert.match(script, /bash scripts\/deploy-stack\.sh/);
  // 同一组键，按 target 取不同值。
  assert.match(script, /PROJECT_NAME=kidora/);
  assert.match(script, /LOCAL_PROJECT_NAME:-kidora-local-release/);
  assert.match(script, /COMPOSE_SUDO=0/);
  assert.match(script, /COMPOSE_SUDO=1/);
  assert.doesNotMatch(script, /dckr_pat_/);
  assert.doesNotMatch(script, /<<'REMOTE'/);
});

test("deploy prod uploads image and configs then verifies health remotely", () => {
  const script = fs.readFileSync(deployScript, "utf8");

  assert.match(script, /IMAGE_TAG/);
  assert.match(script, /DEPLOY_MODE/);
  assert.match(script, /image save/);
  assert.match(script, /docker load/);
  // 上传是 prod 唯一多出的步骤。
  assert.match(script, /scp deploy\/docker-compose\.production\.yml/);
  assert.match(script, /scp scripts\/deploy-stack\.sh/);
});

test("deploy local path runs the stack locally and never contacts the server", () => {
  const script = fs.readFileSync(deployScript, "utf8");
  // PROD-ONLY 标记之前的部分就是 local + 公共段，必须不含任何远端操作。
  const beforeProd = script.split("# PROD-ONLY:")[0];

  assert.match(beforeProd, /bash scripts\/deploy-stack\.sh/);
  assert.doesNotMatch(beforeProd, /\bssh\b/);
  assert.doesNotMatch(beforeProd, /\bscp\b/);
  assert.doesNotMatch(beforeProd, /image save/);
});

test("release script accepts explicit local and prod targets", () => {
  const script = fs.readFileSync(releaseScript, "utf8");

  assert.match(script, /case "\$target"/);
  assert.match(script, /local\|--local/);
  assert.match(script, /prod\|production\|--prod\|--production/);
  assert.match(script, /RELEASE_TARGET/);
  assert.match(script, /Usage: bash scripts\/release\.sh \{local\|prod\}/);
});

test("release builds once then delegates the whole deploy to deploy.sh", () => {
  const script = fs.readFileSync(releaseScript, "utf8");

  assert.match(script, /build_image/);
  assert.match(script, /bash scripts\/deploy\.sh "\$target"/);
  // release.sh 不再含 local/prod 部署分支，也不直接跑栈或上传。
  assert.doesNotMatch(script, /deploy_local\(\)/);
  assert.doesNotMatch(script, /deploy_prod\(\)/);
  assert.doesNotMatch(script, /scripts\/deploy-stack\.sh/);
  assert.doesNotMatch(script, /\bscp\b/);
});

test("deploy stack script is parameter driven without local prod branches", () => {
  const script = fs.readFileSync(deployStackScript, "utf8");

  assert.doesNotMatch(script, /case "\$target"/);
  assert.doesNotMatch(script, /local\|--local/);
  assert.doesNotMatch(script, /prod\|production\|--prod\|--production/);
  assert.match(script, /PROJECT_NAME/);
  assert.match(script, /DEPLOY_DIR/);
  assert.match(script, /ENV_FILE/);
  assert.match(script, /APP_ENV_FILE/);
  assert.match(script, /COMPOSE_SUDO/);
  assert.match(script, /"APP_ENV_FILE=\$APP_ENV_FILE"/);
  assert.match(script, /--project-name "\$PROJECT_NAME"/);
  assert.match(script, /-f deploy\/docker-compose\.production\.yml/);
  assert.match(script, /up -d db openlist web nginx/);
  assert.match(script, /HEALTH_URL/);
});
