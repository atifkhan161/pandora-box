/**
 * Pandora Box - Unified Build Script
 * This script builds and runs both the frontend and backend components
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  client: {
    dir: path.join(__dirname, 'client'),
    buildCmd: 'npm run build',
    startCmd: 'npx http-server dist -p 8082',
    devCmd: 'npm run dev'
  },
  server: {
    dir: path.join(__dirname, 'server'),
    buildCmd: 'npm run build',
    startCmd: 'npm start',
    devCmd: 'npm run dev'
  },
  // Default port configuration
  ports: {
    client: 8080,
    server: 3000
  }
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log a message with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Check if a directory exists and contains a package.json file
 */
function validateProjectDir(dir, name) {
  if (!fs.existsSync(dir)) {
    log(`Error: ${name} directory not found at ${dir}`, colors.red);
    return false;
  }

  // Skip package.json check for client directory as it's a static site
  if (name === 'Client') {
    return true;
  }
  
  const packageJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log(`Error: package.json not found in ${name} directory`, colors.red);
    return false;
  }
  
  return true;
}

/**
 * Install dependencies for a project
 */
function installDependencies(projectConfig, projectName) {
  log(`\n${colors.bright}${colors.cyan}Installing dependencies for ${projectName}...${colors.reset}`);
  try {
    execSync('npm install', { 
      cwd: projectConfig.dir, 
      stdio: 'inherit' 
    });
    
    // Install additional dependencies for server
    if (projectName === 'Server') {
      log(`${colors.cyan}Installing additional dependencies for ${projectName}...${colors.reset}`);
      execSync('npm install axios express-validator jsonwebtoken bcrypt cors dotenv express', { 
        cwd: projectConfig.dir, 
        stdio: 'inherit' 
      });
    }
    
    log(`${colors.green}✓ Dependencies installed for ${projectName}${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}✗ Failed to install dependencies for ${projectName}${colors.reset}`);
    log(`${colors.red}${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Build a project
 */
function buildProject(projectConfig, projectName) {
  log(`\n${colors.bright}${colors.cyan}Building ${projectName}...${colors.reset}`);
  try {
    // Client is a static site, no build step needed
    if (projectName === 'Client') {
      log(`${colors.green}✓ ${projectName} is a static site, no build step required.${colors.reset}`);
      return true;
    } 
    // Build for server using TypeScript
    else if (projectName === 'Server') {
      execSync(projectConfig.buildCmd, { 
        cwd: projectConfig.dir, 
        stdio: 'inherit' 
      });
      log(`${colors.green}✓ ${projectName} built successfully${colors.reset}`);
      return true;
    }
  } catch (error) {
    log(`${colors.red}✗ Failed to build ${projectName}${colors.reset}`);
    log(`${colors.red}${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Copy folder recursively
 */
function copyFolderRecursiveSync(source, target) {
  // Check if source exists
  if (!fs.existsSync(source)) {
    return;
  }

  // Create target folder if it doesn't exist
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Copy files
  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(file => {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        fs.copyFileSync(curSource, path.join(targetFolder, file));
      }
    });
  }
}

/**
 * Start a project
 */
function startProject(projectConfig, projectName) {
  log(`\n${colors.bright}${colors.cyan}Starting ${projectName}...${colors.reset}`);
  
  const parts = projectConfig.startCmd.split(' ');
  const command = parts[0];
  const args = parts.slice(1);
  
  const process = spawn(command, args, { 
    cwd: projectConfig.dir,
    shell: true
  });
  
  process.stdout.on('data', (data) => {
    console.log(`${colors.dim}[${projectName}]${colors.reset} ${data.toString().trim()}`);
  });
  
  process.stderr.on('data', (data) => {
    console.error(`${colors.red}[${projectName} ERROR]${colors.reset} ${data.toString().trim()}`);
  });
  
  process.on('close', (code) => {
    if (code !== 0) {
      log(`${colors.red}${projectName} process exited with code ${code}${colors.reset}`);
    }
  });
  
  return process;
}

/**
 * Start development servers
 */
function startDev() {
  log(`\n${colors.bright}${colors.magenta}=== Pandora Box - Development Mode ===${colors.reset}\n`);
  
  // Validate project directories
  const clientValid = validateProjectDir(config.client.dir, 'Client');
  const serverValid = validateProjectDir(config.server.dir, 'Server');
  
  if (!clientValid || !serverValid) {
    log('Aborting due to missing project directories', colors.red);
    process.exit(1);
  }
  
  log(`${colors.bright}${colors.magenta}Starting development servers...${colors.reset}`);
  
  // Start server first
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: config.server.dir,
    shell: true
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`${colors.blue}[Server]${colors.reset} ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`${colors.red}[Server ERROR]${colors.reset} ${data.toString().trim()}`);
  });
  
  // Start client after a short delay
  setTimeout(() => {
    const clientProcess = spawn('npm', ['run', 'dev'], {
      cwd: config.client.dir,
      shell: true
    });
    
    clientProcess.stdout.on('data', (data) => {
      console.log(`${colors.green}[Client]${colors.reset} ${data.toString().trim()}`);
    });
    
    clientProcess.stderr.on('data', (data) => {
      console.error(`${colors.red}[Client ERROR]${colors.reset} ${data.toString().trim()}`);
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      log(`\n${colors.yellow}Shutting down development servers...${colors.reset}`);
      clientProcess.kill();
      serverProcess.kill();
      log(`${colors.green}Development servers stopped${colors.reset}`);
      process.exit(0);
    });
    
    log(`\n${colors.green}${colors.bright}Development servers started!${colors.reset}`);
    log(`${colors.green}Client: http://localhost:${config.ports.client}${colors.reset}`);
    log(`${colors.green}Server: http://localhost:${config.ports.server}${colors.reset}`);
    log(`\n${colors.yellow}Press Ctrl+C to stop all services${colors.reset}\n`);
    
  }, 2000);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const buildOnly = args.includes('--build-only');
  const devMode = args.includes('--dev') || args.includes('dev');
  
  // Handle dev mode
  if (devMode) {
    startDev();
    return;
  }
  
  log(`\n${colors.bright}${colors.magenta}=== Pandora Box - Unified Build Script ===${colors.reset}\n`);
  
  // Validate project directories
  const clientValid = validateProjectDir(config.client.dir, 'Client');
  const serverValid = validateProjectDir(config.server.dir, 'Server');
  
  if (!clientValid || !serverValid) {
    log('Aborting due to missing project directories', colors.red);
    process.exit(1);
  }
  
  // Install dependencies
  const clientDepsOk = installDependencies(config.client, 'Client');
  const serverDepsOk = installDependencies(config.server, 'Server');
  
  if (!clientDepsOk || !serverDepsOk) {
    log('Aborting due to dependency installation failures', colors.red);
    process.exit(1);
  }
  
  // Build projects
  const clientBuildOk = buildProject(config.client, 'Client');
  const serverBuildOk = buildProject(config.server, 'Server');
  
  if (!clientBuildOk || !serverBuildOk) {
    log('Aborting due to build failures', colors.red);
    process.exit(1);
  }
  
  if (buildOnly) {
    log(`\n${colors.green}${colors.bright}Build completed successfully!${colors.reset}`);
    log(`${colors.green}Run 'node build.js' without --build-only to start the services${colors.reset}`);
    return;
  }
  
  // Start projects
  log(`\n${colors.bright}${colors.magenta}Starting services...${colors.reset}`);
  
  // Start both client and server
  const clientProcess = startProject(config.client, 'Client');
  const serverProcess = startProject(config.server, 'Server');
  
  log(`\n${colors.green}${colors.bright}Services started!${colors.reset}`);
  log(`${colors.green}Client: http://localhost:${config.ports.client}${colors.reset}`);
  log(`${colors.green}Server: http://localhost:${config.ports.server}${colors.reset}`);
  log(`\n${colors.yellow}Press Ctrl+C to stop all services${colors.reset}\n`);
  
  // Handle process termination
  process.on('SIGINT', () => {
    log(`\n${colors.yellow}Shutting down services...${colors.reset}`);
    clientProcess.kill();
    serverProcess.kill();
    log(`${colors.green}Services stopped${colors.reset}`);
    process.exit(0);
  });
}

// Show usage if no arguments provided
if (process.argv.length === 2) {
  log(`\n${colors.bright}${colors.magenta}Pandora Box - Build Script${colors.reset}\n`);
  log(`${colors.cyan}Usage:${colors.reset}`);
  log(`  node build.js                 - Build and start production servers`);
  log(`  node build.js --build-only    - Build only, don't start servers`);
  log(`  node build.js --dev           - Start development servers with hot reload`);
  log(`  node build.js dev             - Start development servers with hot reload`);
  log(`\n${colors.cyan}Development servers:${colors.reset}`);
  log(`  Client: http://localhost:${config.ports.client}`);
  log(`  Server: http://localhost:${config.ports.server}\n`);
  process.exit(0);
}

// Run the main function
main().catch(error => {
  log(`\n${colors.red}Unhandled error:${colors.reset}`, colors.red);
  console.error(error);
  process.exit(1);
});