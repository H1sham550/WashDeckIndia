import { scryptSync, timingSafeEqual } from "crypto";

function verifyPassword(password, storedHash) {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const hashed = scryptSync(password, salt, 64).toString("hex");
    return timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(hashed, "hex"));
  } catch (err) {
    console.error(err);
    return false;
  }
}

const hash = "8f3b9d54880f24075adc5ed879525916:2575a8854a99342ad02e76822dfc75d6266a60f5c160768dc0a4a902ff1a48c2b9de8cf7c619999513c0a51e1e5cc3371827df15d21d3361fb98ab866cfb37df";

console.log("Verify WashDesk123:", verifyPassword("WashDesk123", hash));
console.log("Verify washdesk123:", verifyPassword("washdesk123", hash));
console.log("Verify Washdesk123:", verifyPassword("Washdesk123", hash));
console.log("Verify WashDesk123 with trailing space:", verifyPassword("WashDesk123 ", hash));
