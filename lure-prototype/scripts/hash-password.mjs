import { randomBytes, createHmac } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";

const password = await readHidden("New Lure Assistant password: ");

if (!password || password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const pepper = randomBytes(32).toString("base64url");
const token = createHmac("sha256", pepper).update(password).digest("base64url");

console.log(`AUTH_PASSWORD_TOKEN=${token}`);
console.log(`AUTH_PASSWORD_PEPPER=${pepper}`);
console.log(`AUTH_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);

function readHidden(prompt) {
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    return new Promise((resolve) => {
      let value = "";
      process.stdout.write(prompt);
      input.setEncoding("utf8");
      input.once("data", (chunk) => {
        value = String(chunk).trim();
        resolve(value);
      });
    });
  }

  return new Promise((resolve) => {
    let value = "";
    const finish = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener("data", onData);
      output.write("\n");
      resolve(value);
    };
    const onData = (chunk) => {
      for (const character of String(chunk)) {
        if (character === "\u0003") process.exit(130);
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };
    output.write(prompt);
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");
    input.on("data", onData);
  });
}
