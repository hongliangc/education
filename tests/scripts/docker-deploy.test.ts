import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const publishScript = "scripts/publish-image.sh";
const deployScript = "scripts/deploy.sh";

test("publish script builds and pushes versioned and latest Docker Hub tags", () => {
  const script = fs.readFileSync(publishScript, "utf8");

  assert.match(script, /DOCKER_IMAGE.*hlc2012\/mlk/);
  assert.match(script, /DOCKER_CMD.*docker/);
  assert.match(script, /buildx build/);
  assert.match(script, /--platform linux\/amd64/);
  assert.match(script, /--push/);
  assert.match(script, /:latest/);
});

test("deploy script pulls a selected image tag and verifies health", () => {
  const script = fs.readFileSync(deployScript, "utf8");

  assert.match(script, /IMAGE_TAG/);
  assert.match(script, /docker compose/);
  assert.match(script, /-p kidora/);
  assert.match(script, /"IMAGE_TAG=\$image_tag"/);
  assert.match(script, /"\$\{compose\[@\]\}" pull web/);
  assert.match(script, /"\$\{compose\[@\]\}" up -d/);
  assert.match(script, /api\/health/);
  assert.doesNotMatch(script, /dckr_pat_/);
});

test("deploy script can transfer an image when the server cannot reach Docker Hub", () => {
  const script = fs.readFileSync(deployScript, "utf8");

  assert.match(script, /DEPLOY_MODE/);
  assert.match(script, /image save/);
  assert.match(script, /docker load/);
});
