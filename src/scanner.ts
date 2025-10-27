import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Interface for typing errors
interface FileSystemError extends Error {
  code?: string;
}

/**
 * Function to read the blacklist file with excluded paths
 * @param blacklistPath Path to the blacklist file
 * @returns Array with paths to exclude
 */
async function readBlacklist(blacklistPath: string): Promise<string[]> {
  const blacklist: string[] = [];
  
  try {
    // Check if the blacklist file exists
    await fs.promises.access(blacklistPath, fs.constants.R_OK);
    
    // Create readline interface for reading line by line
    const fileStream = fs.createReadStream(blacklistPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    // Process each line
    for await (const line of rl) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        // Normalize the path (use unified notation for separators)
        blacklist.push(trimmedLine.replace(/\\/g, '/'));
      }
    }
    
    console.log(`Loaded ${blacklist.length} paths from blacklist in ${blacklistPath}`);
  } catch (error: unknown) {
    // Safe error handling with unknown type
    if (error instanceof Error) {
      const fsError = error as FileSystemError;
      if (fsError.code === 'ENOENT') {
        console.warn(`Warning: Blacklist file ${blacklistPath} does not exist. No paths will be excluded.`);
      } else {
        console.warn(`Warning: Cannot read blacklist file ${blacklistPath}: ${fsError.message}`);
      }
    } else {
      console.warn(`Warning: Unexpected error reading blacklist file ${blacklistPath}`);
    }
  }
  
  return blacklist;
}

/**
 * Checks whether a given path should be excluded (blacklisted)
 * @param currentPath Current path to check
 * @param blacklist List of excluded paths
 * @returns true if the path should be excluded, false otherwise
 */
function isBlacklisted(currentPath: string, blacklist: string[]): boolean {
  const normalizedPath = currentPath.replace(/\\/g, '/');
  const pathSegments = normalizedPath.split('/');
  
  for (const item of blacklist) {
    const normalizedItem = item.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''); // Remove leading and trailing /
    
    // 1. Check for direct match of the entire path
    if (normalizedPath === normalizedItem) {
      return true;
    }
    
    // 2. Improved check whether the item is a directory or file
    // A directory is: a) if it ends with /, b) if it's included in knownDirectories, 
    // c) if it doesn't contain a dot (except for hidden directories like .git)
    const knownDirectories = ['node_modules', '.git', '.vscode', 'dist', 'build', 'coverage', 'src', 'test'];
    const endsWithSlash = normalizedItem.endsWith('/');
    const isKnownDirectory = knownDirectories.includes(normalizedItem);
    const isHiddenDir = normalizedItem.startsWith('.') && !normalizedItem.includes('.', 1);
    const hasNoExtension = !normalizedItem.includes('.');
    
    const isDirectory = endsWithSlash || isKnownDirectory || isHiddenDir || hasNoExtension;
    
    if (isDirectory) {
      // 3. Check if the path starts with the item from blacklist (standard blacklist case)
      if (normalizedPath === normalizedItem || 
          normalizedPath.startsWith(normalizedItem + '/')) {
        return true;
      }
      
      // 4. Check if any segment of the path matches the directory from blacklist
      // This will apply to node_modules in subfolders
      if (pathSegments.includes(normalizedItem)) {
        return true;
      }
    } else {
      // 5. For files: check if the last segment (filename) matches the blacklist item
      const fileName = pathSegments[pathSegments.length - 1];
      if (fileName === normalizedItem) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Checks if the file is an .env file
 * @param filePath Path to the file
 * @returns true if the file is an .env file, false otherwise
 */
function isEnvFile(filePath: string): boolean {
  const fileName = path.basename(filePath).toLowerCase();
  return fileName === '.env' || fileName.startsWith('.env.') || fileName.endsWith('.env');
}

/**
 * Checks if the file is a text file based on its extension
 * @param filePath Path to the file
 * @returns true if the file is a text file, false otherwise
 */
function isTextFile(filePath: string): boolean {
  const textExtensions = [
    '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.html', '.htm',
    '.xml', '.json', '.yaml', '.yml', '.csv', '.ini', '.conf', '.py', '.java',
    '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rb', '.php', '.pl', '.sh', '.bat',
    '.ps1', '.sql', '.gitignore', '.env', '.config', '.toml', '.dockerfile'
  ];
  
  // Files without extension that are often text files
  const textFilenames = [
    'dockerfile', 'makefile', 'jenkinsfile', 'vagrantfile', 'readme', 'license',
    'gemfile', 'rakefile', 'procfile', '.gitignore', '.dockerignore', '.npmignore'
  ];
  
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath).toLowerCase();
  
  return textExtensions.includes(ext) || textFilenames.includes(filename);
}

/**
 * Safely read a text file
 * @param filePath Path to the file
 * @returns File content or error message
 */
async function safeReadFile(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `[Error reading file: ${error.message}]`;
    }
    return '[Unexpected error reading file]';
  }
}

/**
 * Recursively scan a directory
 * @param dirPath Current directory to scan
 * @param blacklist List of excluded paths
 * @param outputStream Stream for writing to output file
 * @param basePath Base directory (starting point of scanning)
 * @param stats Statistics for tracking progress
 * @param includeEnvFiles Flag whether to include .env files
 */
async function scanDirectory(
  dirPath: string, 
  blacklist: string[], 
  outputStream: fs.WriteStream,
  basePath: string,
  stats: { dirs: number, files: number, skipped: number, envFiles: number },
  includeEnvFiles: boolean
): Promise<void> {
  try {
    // Get all items in the directory
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      // Get the relative path from the base directory
      const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');
      
      // Skip if the path is in the blacklist
      if (isBlacklisted(relativePath, blacklist)) {
        stats.skipped++;
        if (process.env.DEBUG) {
          console.log(`Skipping blacklisted path: ${relativePath}`);
        }
        continue;
      }
      
      // Write the path to file
      outputStream.write(`${relativePath}\n`);
      
      if (entry.isDirectory()) {
        stats.dirs++;
        // Show progress every 100 directories
        if (stats.dirs % 100 === 0) {
          console.log(`Progress: ${stats.dirs} directories, ${stats.files} files processed, ${stats.skipped} skipped, ${stats.envFiles} .env files`);
        }
        // Recursively scan subdirectories
        await scanDirectory(fullPath, blacklist, outputStream, basePath, stats, includeEnvFiles);
      } else {
        stats.files++;
        
        // Check if the file is an .env file
        const isEnv = isEnvFile(fullPath);
        
        if (isEnv) {
          stats.envFiles++;
          
          // Skip the .env file if it should not be included
          if (!includeEnvFiles) {
            outputStream.write(`[.env file - content skipped according to settings]\n\n`);
            if (process.env.DEBUG) {
              console.log(`Skipping .env file: ${relativePath}`);
            }
            continue;
          }
          
          // If it's an .env file and the option is enabled - read and add directly,
          // without checking if it's a text file
          try {
            const content = await safeReadFile(fullPath);
            outputStream.write(`### .env file content ###\n${content}\n### End of .env file ###\n\n`);
            if (process.env.DEBUG) {
              console.log(`Included .env file: ${relativePath}`);
            }
          } catch (error: unknown) {
            if (error instanceof Error) {
              outputStream.write(`[Error reading .env file: ${error.message}]\n\n`);
            } else {
              outputStream.write(`[Unexpected error reading .env file]\n\n`);
            }
          }
          continue; // Continue with the next file/directory
        }
        
        // For all other files (not .env) - check if they are text files
        if (!isTextFile(fullPath)) {
          outputStream.write(`[Binary or non-text content not shown]\n\n`);
          continue;
        }
        
        // Read and write file content (not .env)
        try {
          const content = await safeReadFile(fullPath);
          outputStream.write(`${content}\n\n`);
        } catch (error: unknown) {
          if (error instanceof Error) {
            outputStream.write(`[Error reading content: ${error.message}]\n\n`);
          } else {
            outputStream.write(`[Unexpected error reading content]\n\n`);
          }
        }
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error scanning directory ${dirPath}: ${error.message}`);
    } else {
      console.error(`Unexpected error scanning directory ${dirPath}`);
    }
  }
}

/**
 * Parse command line arguments
 * @returns Object with target directory, blacklist path, output path, and .env files flag
 */
function parseArgs(): { targetDir: string, blacklistPath: string, outputPath: string, includeEnvFiles: boolean } {
  let targetDir = process.cwd();
  let blacklistPath = '';
  let outputPath = '';
  let includeEnvFiles = false;  // By default .env files are not included
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg === '--dir' || arg === '-d') {
      targetDir = process.argv[++i] || targetDir;
    } else if (arg === '--blacklist' || arg === '-b') {
      blacklistPath = process.argv[++i] || '';
    } else if (arg === '--output' || arg === '-o') {
      outputPath = process.argv[++i] || '';
    } else if (arg === '--env' || arg === '-e') {
      includeEnvFiles = true;  // Flag to include .env files
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Directory Scanner - Recursively scans a directory and outputs paths and file contents

Usage:
  npm run scanner -- [options]

Options:
  --dir, -d        Target directory to scan (default: current directory)
  --blacklist, -b  Path to blacklist file (default: <target_directory>/blacklist.txt)
  --output, -o     Path to output file (default: <target_directory>/project_files.txt)
  --env, -e        Include content of .env files (default: disabled)
  --help, -h       Show this help message
  
Environment variables:
  DEBUG=1          Enable additional debug output
`);
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      targetDir = arg;
    }
  }
  
  // Use default values if not specified
  if (!blacklistPath) {
    blacklistPath = path.join(targetDir, 'blacklist.txt');
  }
  
  if (!outputPath) {
    outputPath = path.join(targetDir, 'project_files.txt');
  }
  
  return { targetDir, blacklistPath, outputPath, includeEnvFiles };
}

/**
 * Main function of the program
 */
async function main() {
  const { targetDir, blacklistPath, outputPath, includeEnvFiles } = parseArgs();
  
  console.log(`Starting directory scan: ${targetDir}`);
  console.log(`Using blacklist from: ${blacklistPath}`);
  console.log(`Output will be written to: ${outputPath}`);
  console.log(`.env files: ${includeEnvFiles ? 'will be included' : 'will not be included'}`);
  
  // Read the blacklist
  const blacklist = await readBlacklist(blacklistPath);
  
  // Create stream for writing to output file
  const outputStream = fs.createWriteStream(outputPath);
  
  // Statistics for tracking progress
  const stats = { dirs: 0, files: 0, skipped: 0, envFiles: 0 };
  
  try {
    // Start recursive scanning
    console.log('Starting scan...');
    const startTime = Date.now();
    
    await scanDirectory(targetDir, blacklist, outputStream, targetDir, stats, includeEnvFiles);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`
Scan completed in ${duration.toFixed(2)} seconds:
- Directories processed: ${stats.dirs}
- Files processed: ${stats.files}
- Items skipped (blacklist): ${stats.skipped}
- .env files found: ${stats.envFiles} ${includeEnvFiles ? '(included)' : '(skipped)'}
- Output written to: ${outputPath}
`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error during scanning: ${error.message}`);
    } else {
      console.error(`Unexpected error during scanning`);
    }
  } finally {
    // Close the output stream
    outputStream.end();
  }
}

// Execute the program
main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(`Fatal error: ${error.message}`);
  } else {
    console.error(`Unexpected fatal error`);
  }
  process.exit(1);
});
