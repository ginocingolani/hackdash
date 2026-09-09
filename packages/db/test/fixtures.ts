import { UserModel } from "../src/models/user";

let seq = 0;

export async function makeUser(overrides: Record<string, unknown> = {}) {
  seq += 1;
  return UserModel.create({
    provider: "test",
    provider_id: `test-${seq}`,
    username: `user${seq}`,
    name: `User ${seq}`,
    email: `user${seq}@test.local`,
    ...overrides,
  });
}

export const id = (doc: { _id: unknown }) => String(doc._id);
