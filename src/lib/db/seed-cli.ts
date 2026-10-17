import { seed } from "./seed";

seed()
  .then(() => {
    console.log("Seeded Kamla Sharma example household.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
