const mongoose = require("mongoose");
const readline = require("readline");
const path = require("path");

// Load environment variables from server/.env
require("dotenv").config({
  path: path.join(__dirname, "..", "server", ".env"),
});

// Import ethers for blockchain interaction
const { ethers } = require("ethers");

// UserRegistry ABI (you'll need to add this)
const USER_REGISTRY_ABI = [
  "function setUser(address user, bool isApproved, uint8 role) external",
  "function getUser(address user) external view returns (bool isApproved, uint8 role)",
  "function isAuthorized(address user, uint8 requiredRole) external view returns (bool)",
  "event UserRoleSet(address indexed user, bool isApproved, uint8 role)"
];

// ANSI Color codes for terminal styling
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

// Styled logging functions
const log = {
  title: (text) =>
    console.log(
      `\n${colors.bright}${colors.cyan}╔${"═".repeat(60)}╗${colors.reset}`
    ),
  titleText: (text) =>
    console.log(
      `${colors.bright}${colors.cyan}║${colors.white}  ${text.padEnd(58)}${
        colors.cyan
      }║${colors.reset}`
    ),
  titleEnd: () =>
    console.log(
      `${colors.bright}${colors.cyan}╚${"═".repeat(60)}╝${colors.reset}\n`
    ),

  success: (text) =>
    console.log(
      `${colors.green}✓${colors.reset} ${colors.bright}${text}${colors.reset}`
    ),
  error: (text) =>
    console.log(
      `${colors.red}✗${colors.reset} ${colors.bright}${text}${colors.reset}`
    ),
  warning: (text) =>
    console.log(
      `${colors.yellow}⚠${colors.reset} ${colors.dim}${text}${colors.reset}`
    ),
  info: (text) => console.log(`${colors.cyan}ℹ${colors.reset} ${text}`),
  loading: (text) =>
    console.log(
      `${colors.blue}⟳${colors.reset} ${colors.dim}${text}${colors.reset}`
    ),

  box: (title, content) => {
    console.log(
      `\n${colors.bright}${colors.green}┌${"─".repeat(60)}┐${colors.reset}`
    );
    console.log(
      `${colors.bright}${colors.green}│${colors.white}  ${title.padEnd(58)}${
        colors.green
      }│${colors.reset}`
    );
    console.log(
      `${colors.bright}${colors.green}├${"─".repeat(60)}┤${colors.reset}`
    );
    content.forEach((line) => {
      console.log(
        `${colors.bright}${colors.green}│${colors.reset}  ${line.padEnd(58)}${
          colors.reset
        }${colors.bright}${colors.green}│${colors.reset}`
      );
    });
    console.log(
      `${colors.bright}${colors.green}└${"─".repeat(60)}┘${colors.reset}\n`
    );
  },

  divider: () => console.log(`${colors.dim}${"─".repeat(62)}${colors.reset}`),
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask questions with styled prompt
const askQuestion = (question, emoji = "❯") => {
  return new Promise((resolve) => {
    rl.question(
      `${colors.bright}${colors.magenta}${emoji}${colors.reset} ${colors.white}${question}${colors.reset} `,
      (answer) => {
        resolve(answer.trim());
      }
    );
  });
};

// Function to validate Ethereum address format
const isValidEthereumAddress = (address) => {
  const ethereumAddressPattern = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressPattern.test(address);
};

// Function to validate email format
const isValidEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

// Setup blockchain connection
const setupBlockchain = () => {
  try {
    // Get configuration from environment
    const rpcUrl = process.env.BLOCKCHAIN_RPC || process.env.PROVIDER_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const userContractAddress = process.env.USER_CONTRACT_ADDRESS;

    if (!rpcUrl) {
      throw new Error("BLOCKCHAIN_RPC not found in .env");
    }

    if (!privateKey) {
      throw new Error("PRIVATE_KEY not found in .env");
    }

    if (!userContractAddress) {
      throw new Error("USER_CONTRACT_ADDRESS not found in .env");
    }

    // Remove 0x prefix if present in private key
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(cleanPrivateKey, provider);

    // Create contract instance
    const userRegistry = new ethers.Contract(userContractAddress, USER_REGISTRY_ABI, signer);

    log.success("Blockchain connection established");
    log.info(`Network: ${rpcUrl}`);
    log.info(`Contract: ${userContractAddress}`);
    log.info(`Signer: ${signer.address}`);

    return userRegistry;
  } catch (error) {
    log.warning(`Blockchain setup failed: ${error.message}`);
    log.info("Superuser will be created in database only");
    return null;
  }
};

// Display animated banner
const showBanner = () => {
  console.clear();
  log.title();
  log.titleText("🔐  PHARMATRACE SUPERADMIN CREATOR  🔐");
  log.titleEnd();
  console.log(
    `${colors.dim}    Creating superuser for live deployment${colors.reset}\n`
  );
};

// Main function to create superuser
const createSuperUser = async () => {
  showBanner();

  let userRegistry = null;

  try {
    // Setup blockchain connection
    log.loading("Setting up blockchain connection...");
    userRegistry = setupBlockchain();

    // Get MongoDB URI from environment
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in server/.env file");
    }

    log.loading("Connecting to live MongoDB Atlas...");
    const maskedUri = mongoUri.replace(/\/\/.*@/, "//<credentials>@");
    console.log(`${colors.dim}  └─ ${maskedUri}${colors.reset}\n`);

    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
    });

    log.success("Connected to live MongoDB Atlas successfully");
    log.divider();

    // Get direct access to the database
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    let address, email, name;

    // Get MetaMask wallet address
    console.log(
      `\n${colors.bright}${colors.blue}STEP 1: Wallet Address${colors.reset}`
    );
    while (true) {
      address = await askQuestion("Enter MetaMask wallet address:", "🔑");

      if (!address) {
        log.error("Wallet address is required");
        continue;
      }

      if (!isValidEthereumAddress(address)) {
        log.error("Invalid Ethereum address format (must start with 0x)");
        continue;
      }

      // Normalize address to lowercase
      address = address.toLowerCase();

      // Check if user already exists
      log.loading("Checking live database for existing user...");
      const existingUser = await usersCollection.findOne(
        { address },
        { maxTimeMS: 15000 }
      );

      if (existingUser) {
        log.warning(
          `User already exists with role: ${colors.bright}${existingUser.role}${colors.reset}`
        );
        const overwrite = await askQuestion("Update to superadmin? (y/n):", "🔄");

        if (
          overwrite.toLowerCase() === "yes" ||
          overwrite.toLowerCase() === "y"
        ) {
          log.loading("Updating user permissions in live database...");
          await usersCollection.updateOne(
            { address },
            {
              $set: {
                role: "superadmin",
                isApproved: true,
                isActive: true,
                permissions: ["*"],
                lastLogin: new Date(),
                updatedAt: new Date(),
              },
            },
            { maxTimeMS: 15000 }
          );

          // Update blockchain if available
          if (userRegistry) {
            try {
              log.loading("Setting superadmin role on live blockchain...");
              const RoleEnum = { None: 0, Superadmin: 1, Manufacturer: 2, Distributor: 3, Pharmacist: 4 };
              const tx = await userRegistry.setUser(address, true, RoleEnum.Superadmin);
              await tx.wait();
              log.success("Blockchain role updated successfully");
            } catch (blockchainError) {
              log.warning(`Blockchain update failed: ${blockchainError.message}`);
            }
          }

          const updatedUser = await usersCollection.findOne(
            { address },
            { maxTimeMS: 15000 }
          );

          log.box("✓ SUPERADMIN UPDATED SUCCESSFULLY", [
            `${colors.cyan}Address:${colors.reset} ${updatedUser.address}`,
            `${colors.cyan}Name:${colors.reset}    ${updatedUser.name}`,
            `${colors.cyan}Email:${colors.reset}   ${updatedUser.email}`,
            `${colors.cyan}Role:${colors.reset}    ${colors.green}${updatedUser.role}${colors.reset}`,
            `${colors.cyan}Status:${colors.reset}  ${colors.green}Active & Approved${colors.reset}`,
            `${colors.cyan}Database:${colors.reset} Live MongoDB Atlas`,
            `${colors.cyan}Blockchain:${colors.reset} ${userRegistry ? 'Updated' : 'Skipped'}`,
          ]);

          rl.close();
          await mongoose.disconnect();
          process.exit(0);
        } else {
          continue;
        }
      }

      log.success("Address verified");
      break;
    }

    // Get email
    console.log(
      `\n${colors.bright}${colors.blue}STEP 2: Email Address${colors.reset}`
    );
    while (true) {
      email = await askQuestion("Enter email address:", "📧");

      if (!email) {
        log.error("Email is required");
        continue;
      }

      if (!isValidEmail(email)) {
        log.error("Invalid email format");
        continue;
      }

      // Check if email already exists
      log.loading("Verifying email availability...");
      const existingEmail = await usersCollection.findOne(
        { email },
        { maxTimeMS: 15000 }
      );
      if (existingEmail) {
        log.error(`Email ${email} is already registered`);
        continue;
      }

      log.success("Email verified");
      break;
    }

    // Get name
    console.log(
      `\n${colors.bright}${colors.blue}STEP 3: Full Name${colors.reset}`
    );
    while (true) {
      name = await askQuestion("Enter full name:", "👤");

      if (!name || name.length < 2) {
        log.error("Name must be at least 2 characters");
        continue;
      }

      log.success("Name accepted");
      break;
    }

    // Create superuser
    log.divider();
    log.loading("Creating superadmin account in live database...");

    const superUserDoc = {
      address,
      email,
      name,
      country: "N/A",
      role: "superadmin",
      isApproved: true,
      isActive: true,
      permissions: ["*"],
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(superUserDoc, {
      maxTimeMS: 15000,
    });

    if (result.insertedId) {
      // Set blockchain role if available
      let blockchainStatus = "Skipped (No connection)";
      if (userRegistry) {
        try {
          log.loading("Setting superadmin role on live blockchain...");
          const RoleEnum = { None: 0, Superadmin: 1, Manufacturer: 2, Distributor: 3, Pharmacist: 4 };
          const tx = await userRegistry.setUser(address, true, RoleEnum.Superadmin);
          await tx.wait();
          blockchainStatus = "✅ Success";
          log.success("Blockchain role set successfully");
        } catch (blockchainError) {
          blockchainStatus = `❌ Failed: ${blockchainError.message}`;
          log.warning(`Blockchain role setting failed: ${blockchainError.message}`);
        }
      }

      log.box("✓ SUPERADMIN CREATED SUCCESSFULLY", [
        `${colors.cyan}Address:${colors.reset} ${superUserDoc.address}`,
        `${colors.cyan}Name:${colors.reset}    ${superUserDoc.name}`,
        `${colors.cyan}Email:${colors.reset}   ${superUserDoc.email}`,
        `${colors.cyan}Role:${colors.reset}    ${colors.green}${superUserDoc.role}${colors.reset}`,
        `${colors.cyan}Status:${colors.reset}  ${colors.green}Active & Approved${colors.reset}`,
        `${colors.cyan}Database:${colors.reset} ✅ Live MongoDB Atlas`,
        `${colors.cyan}Blockchain:${colors.reset} ${blockchainStatus}`,
        "",
        `${colors.dim}You can now login at: ${process.env.FRONTEND_URL || 'your-frontend-url'}${colors.reset}`,
      ]);
    } else {
      throw new Error("Failed to create superuser in database");
    }
  } catch (error) {
    console.log("\n");
    log.error(`Error: ${error.message}`);

    if (error.code === 11000) {
      log.warning("Wallet address or email already registered");
    } else if (error.name === "MongooseServerSelectionError") {
      log.warning("Cannot connect to MongoDB Atlas. Please check:");
      console.log(`${colors.dim}   • Internet connection${colors.reset}`);
      console.log(`${colors.dim}   • MONGODB_URI in server/.env is correct${colors.reset}`);
      console.log(`${colors.dim}   • MongoDB Atlas allows connections from your IP${colors.reset}`);
    }

    process.exit(1);
  } finally {
    rl.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      log.info("MongoDB connection closed");
    }
  }
};

// Handle process termination
process.on("SIGINT", async () => {
  console.log(`\n\n${colors.yellow}⚠  Operation cancelled by user${colors.reset}`);
  rl.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log(`\n\n${colors.yellow}⚠  Operation terminated${colors.reset}`);
  rl.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(0);
});

// Run the script
createSuperUser();