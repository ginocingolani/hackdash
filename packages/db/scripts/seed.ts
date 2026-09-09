import { seed } from "../src/seed";

const adminFlag = process.argv.indexOf("--admin");
const adminEmail = adminFlag > -1 ? process.argv[adminFlag + 1] : undefined;

seed({ adminEmail })
  .then(({ adminId }) => {
    console.log(`Seeded. Admin user id: ${adminId}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
