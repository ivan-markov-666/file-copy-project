import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Интерфейс за типизиране на грешките
interface FileSystemError extends Error {
  code?: string;
}

/**
 * Функция за четене на blacklist файла с изключените пътища
 * @param blacklistPath Пътят до blacklist файла
 * @returns Масив с пътищата за изключване
 */
async function readBlacklist(blacklistPath: string): Promise<string[]> {
  const blacklist: string[] = [];
  
  try {
    // Проверка дали blacklist файлът съществува
    await fs.promises.access(blacklistPath, fs.constants.R_OK);
    
    // Създаване на readline интерфейс за четене ред по ред
    const fileStream = fs.createReadStream(blacklistPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    // Обработка на всеки ред
    for await (const line of rl) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        // Нормализиране на пътя (да използва единна нотация за разделителите)
        blacklist.push(trimmedLine.replace(/\\/g, '/'));
      }
    }
    
    console.log(`Заредени ${blacklist.length} пътя от черния списък в ${blacklistPath}`);
  } catch (error: unknown) {
    // Безопасна обработка на грешка с тип unknown
    if (error instanceof Error) {
      const fsError = error as FileSystemError;
      if (fsError.code === 'ENOENT') {
        console.warn(`Внимание: Blacklist файлът ${blacklistPath} не съществува. Няма да бъдат изключени пътища.`);
      } else {
        console.warn(`Внимание: Не може да се прочете blacklist файлът ${blacklistPath}: ${fsError.message}`);
      }
    } else {
      console.warn(`Внимание: Неочаквана грешка при четене на blacklist файла ${blacklistPath}`);
    }
  }
  
  return blacklist;
}

/**
 * Проверява дали даден път трябва да бъде изключен (blacklisted)
 * @param currentPath Текущият път за проверка
 * @param blacklist Списък с изключени пътища
 * @returns true ако пътят трябва да бъде изключен, false в противен случай
 */
function isBlacklisted(currentPath: string, blacklist: string[]): boolean {
  const normalizedPath = currentPath.replace(/\\/g, '/');
  const pathSegments = normalizedPath.split('/');
  
  for (const item of blacklist) {
    const normalizedItem = item.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''); // Премахване на водещи и крайни /
    
    // 1. Проверка за директно съвпадение на целия път
    if (normalizedPath === normalizedItem) {
      return true;
    }
    
    // 2. Подобрена проверка дали елементът е директория или файл
    // Директория е: а) ако завършва с /, б) ако е включена в директорииБезТочка, 
    // в) ако не съдържа точка (с изключение на скрити директории като .git)
    const knownDirectories = ['node_modules', '.git', '.vscode', 'dist', 'build', 'coverage', 'src', 'test'];
    const endsWithSlash = normalizedItem.endsWith('/');
    const isKnownDirectory = knownDirectories.includes(normalizedItem);
    const isHiddenDir = normalizedItem.startsWith('.') && !normalizedItem.includes('.', 1);
    const hasNoExtension = !normalizedItem.includes('.');
    
    const isDirectory = endsWithSlash || isKnownDirectory || isHiddenDir || hasNoExtension;
    
    if (isDirectory) {
      // 3. Проверка дали пътят започва с елемента от blacklist (стандартен blacklist случай)
      if (normalizedPath === normalizedItem || 
          normalizedPath.startsWith(normalizedItem + '/')) {
        return true;
      }
      
      // 4. Проверка дали някой сегмент от пътя съвпада с директорията от blacklist
      // Това ще се отнася за node_modules в подпапки
      if (pathSegments.includes(normalizedItem)) {
        return true;
      }
    } else {
      // 5. За файлове: проверяваме дали последният сегмент (файловото име) съвпада с blacklist елемента 
      const fileName = pathSegments[pathSegments.length - 1];
      if (fileName === normalizedItem) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Проверява дали файлът е .env файл
 * @param filePath Пътят до файла
 * @returns true ако файлът е .env файл, false в противен случай
 */
function isEnvFile(filePath: string): boolean {
  const fileName = path.basename(filePath).toLowerCase();
  return fileName === '.env' || fileName.startsWith('.env.') || fileName.endsWith('.env');
}

/**
 * Проверява дали файлът е текстов на база на разширението му
 * @param filePath Пътят до файла
 * @returns true ако файлът е текстов, false в противен случай
 */
function isTextFile(filePath: string): boolean {
  const textExtensions = [
    '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.html', '.htm',
    '.xml', '.json', '.yaml', '.yml', '.csv', '.ini', '.conf', '.py', '.java',
    '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rb', '.php', '.pl', '.sh', '.bat',
    '.ps1', '.sql', '.gitignore', '.env', '.config', '.toml', '.dockerfile'
  ];
  
  // Файлове без разширение, които често са текстови
  const textFilenames = [
    'dockerfile', 'makefile', 'jenkinsfile', 'vagrantfile', 'readme', 'license',
    'gemfile', 'rakefile', 'procfile', '.gitignore', '.dockerignore', '.npmignore'
  ];
  
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath).toLowerCase();
  
  return textExtensions.includes(ext) || textFilenames.includes(filename);
}

/**
 * Безопасно четене на текстов файл
 * @param filePath Пътят до файла
 * @returns Съдържанието на файла или съобщение за грешка
 */
async function safeReadFile(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `[Грешка при четене на файла: ${error.message}]`;
    }
    return '[Неочаквана грешка при четене на файла]';
  }
}

/**
 * Рекурсивно сканиране на директория
 * @param dirPath Текущата директория за сканиране
 * @param blacklist Списък с изключени пътища
 * @param outputStream Поток за записване на изходния файл
 * @param basePath Базовата директория (началната точка на сканиране)
 * @param stats Статистика за проследяване на прогреса
 * @param includeEnvFiles Флаг дали да се включват .env файлове
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
    // Вземане на всички елементи в директорията
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      // Получаване на относителния път спрямо базовата директория
      const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');
      
      // Пропускане ако пътят е в черния списък
      if (isBlacklisted(relativePath, blacklist)) {
        stats.skipped++;
        if (process.env.DEBUG) {
          console.log(`Пропускане на път от черния списък: ${relativePath}`);
        }
        continue;
      }
      
      // Записване на пътя във файла
      outputStream.write(`${relativePath}\n`);
      
      if (entry.isDirectory()) {
        stats.dirs++;
        // Показване на прогрес на всеки 100 директории
        if (stats.dirs % 100 === 0) {
          console.log(`Прогрес: ${stats.dirs} директории, ${stats.files} файла обработени, ${stats.skipped} пропуснати, ${stats.envFiles} .env файла`);
        }
        // Рекурсивно сканиране на поддиректории
        await scanDirectory(fullPath, blacklist, outputStream, basePath, stats, includeEnvFiles);
      } else {
        stats.files++;
        
        // Проверка дали файлът е .env файл
        const isEnv = isEnvFile(fullPath);
        
        if (isEnv) {
          stats.envFiles++;
          
          // Пропускане на .env файла ако не трябва да се включват
          if (!includeEnvFiles) {
            outputStream.write(`[.env файл - съдържанието е пропуснато съгласно настройките]\n\n`);
            if (process.env.DEBUG) {
              console.log(`Пропускане на .env файл: ${relativePath}`);
            }
            continue;
          }
          
          // Ако е .env файл и е включена опцията - директно четем и добавяме,
          // без да проверяваме дали е текстов файл
          try {
            const content = await safeReadFile(fullPath);
            outputStream.write(`### Съдържание на .env файл ###\n${content}\n### Край на .env файл ###\n\n`);
            if (process.env.DEBUG) {
              console.log(`Включен .env файл: ${relativePath}`);
            }
          } catch (error: unknown) {
            if (error instanceof Error) {
              outputStream.write(`[Грешка при четене на .env файл: ${error.message}]\n\n`);
            } else {
              outputStream.write(`[Неочаквана грешка при четене на .env файл]\n\n`);
            }
          }
          continue; // Продължаваме със следващия файл/директория
        }
        
        // За всички други файлове (не .env) - проверяваме дали са текстови
        if (!isTextFile(fullPath)) {
          outputStream.write(`[Бинарно или не-текстово съдържание не е показано]\n\n`);
          continue;
        }
        
        // Четене и записване на съдържанието на файла (не .env)
        try {
          const content = await safeReadFile(fullPath);
          outputStream.write(`${content}\n\n`);
        } catch (error: unknown) {
          if (error instanceof Error) {
            outputStream.write(`[Грешка при четене на съдържанието: ${error.message}]\n\n`);
          } else {
            outputStream.write(`[Неочаквана грешка при четене на съдържанието]\n\n`);
          }
        }
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Грешка при сканиране на директория ${dirPath}: ${error.message}`);
    } else {
      console.error(`Неочаквана грешка при сканиране на директория ${dirPath}`);
    }
  }
}

/**
 * Парсване на аргументите от командния ред
 * @returns Обект с целевата директория, пътя до blacklist, пътя до изходния файл и флаг за .env файлове
 */
function parseArgs(): { targetDir: string, blacklistPath: string, outputPath: string, includeEnvFiles: boolean } {
  let targetDir = process.cwd();
  let blacklistPath = '';
  let outputPath = '';
  let includeEnvFiles = false;  // По подразбиране .env файловете не се включват
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg === '--dir' || arg === '-d') {
      targetDir = process.argv[++i] || targetDir;
    } else if (arg === '--blacklist' || arg === '-b') {
      blacklistPath = process.argv[++i] || '';
    } else if (arg === '--output' || arg === '-o') {
      outputPath = process.argv[++i] || '';
    } else if (arg === '--env' || arg === '-e') {
      includeEnvFiles = true;  // Флаг за включване на .env файлове
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Скенер на директории - Рекурсивно сканира директория и извежда пътищата и съдържанието на файловете

Употреба:
  npm run scanner -- [опции]

Опции:
  --dir, -d        Целева директория за сканиране (по подразбиране: текущата директория)
  --blacklist, -b  Път до blacklist файла (по подразбиране: <целева_директория>/blacklist.txt)
  --output, -o     Път до изходния файл (по подразбиране: <целева_директория>/project_files.txt)
  --env, -e        Включване на съдържанието на .env файловете (по подразбиране: изключено)
  --help, -h       Показва това помощно съобщение
  
Променливи на средата:
  DEBUG=1          Включва допълнителен дебъг изход
`);
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      targetDir = arg;
    }
  }
  
  // Използване на стойности по подразбиране, ако не са указани
  if (!blacklistPath) {
    blacklistPath = path.join(targetDir, 'blacklist.txt');
  }
  
  if (!outputPath) {
    outputPath = path.join(targetDir, 'project_files.txt');
  }
  
  return { targetDir, blacklistPath, outputPath, includeEnvFiles };
}

/**
 * Главна функция на програмата
 */
async function main() {
  const { targetDir, blacklistPath, outputPath, includeEnvFiles } = parseArgs();
  
  console.log(`Стартиране на сканиране на директория: ${targetDir}`);
  console.log(`Използване на blacklist от: ${blacklistPath}`);
  console.log(`Изходът ще бъде записан в: ${outputPath}`);
  console.log(`.env файлове: ${includeEnvFiles ? 'ще бъдат включени' : 'няма да бъдат включени'}`);
  
  // Четене на blacklist списъка
  const blacklist = await readBlacklist(blacklistPath);
  
  // Създаване на поток за записване на изходния файл
  const outputStream = fs.createWriteStream(outputPath);
  
  // Статистика за проследяване на прогреса
  const stats = { dirs: 0, files: 0, skipped: 0, envFiles: 0 };
  
  try {
    // Стартиране на рекурсивното сканиране
    console.log('Стартиране на сканирането...');
    const startTime = Date.now();
    
    await scanDirectory(targetDir, blacklist, outputStream, targetDir, stats, includeEnvFiles);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`
Сканирането завърши за ${duration.toFixed(2)} секунди:
- Обработени директории: ${stats.dirs}
- Обработени файлове: ${stats.files}
- Пропуснати елементи (blacklist): ${stats.skipped}
- Намерени .env файлове: ${stats.envFiles} ${includeEnvFiles ? '(включени)' : '(пропуснати)'}
- Изходът е записан в: ${outputPath}
`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Грешка по време на сканирането: ${error.message}`);
    } else {
      console.error(`Неочаквана грешка по време на сканирането`);
    }
  } finally {
    // Затваряне на изходния поток
    outputStream.end();
  }
}

// Изпълнение на програмата
main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(`Фатална грешка: ${error.message}`);
  } else {
    console.error(`Неочаквана фатална грешка`);
  }
  process.exit(1);
});
