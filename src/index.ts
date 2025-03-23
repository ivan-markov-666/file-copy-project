import * as fs from 'fs';
import * as path from 'path';

// Пътища към файловете
const rootDir = process.cwd();

// Опции за изпълнение
interface Options {
  removeComments: boolean;
  rootFolder: string | null; // За филтриране на път до ROOT папката
  filesListFile: string; // Файлът със списъка с файлове за обработка
  outputFile: string; // Изходен файл за записване на резултата
  skipDirectories: boolean; // Дали да се пропускат директориите
  excludedFiles: string[]; // Списък с файлове и шаблони, които да се пропускат
  excludeFromFile: string | null; // Файл със списък с файлове за изключване
}

// Глобални опции със стойности по подразбиране
const options: Options = {
  removeComments: true,
  rootFolder: null,
  filesListFile: 'files-list.txt', // По подразбиране
  outputFile: 'prompt.txt', // По подразбиране
  skipDirectories: true, // По подразбиране пропускаме директориите
  excludedFiles: [], // Празен списък по подразбиране
  excludeFromFile: null,
};

// Списък със стандартни файлове за пропускане
const defaultExcludedFiles = [
  'tsconfig.json',
  'README.md',
  'readme.md',
  'Readme.md',
  'prompt.txt',
  'package-lock.json',
  'LICENSE',
  'README_ALL_BE.md',
  'how-be-works.drawio',
  '.prettierrc',
  '.gitignore',
  '.eslintrc.js',
  '.env.test',
  '.env.production',
  '.env.elasticSearchExample',
  'src\\user\\user.controller.spec.ts',
  'src\\user\\user.service.spec.ts',
  'src/user/user.controller.spec.ts',
  'src/user/user.service.spec.ts',
  '*.spec.ts', // Всички тестови файлове
  '*.test.ts', // Всички тестови файлове
];

/**
 * Чете съдържанието на файл
 * @param filePath - път към файла
 * @returns съдържание на файла като стринг
 */
function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Грешка при четене на файл ${filePath}:`, error);
    return '';
  }
}

/**
 * Определя типа на файла по неговото разширение
 * @param filePath - път към файла
 * @returns тип на файла
 */
function getFileType(filePath: string): 'typescript' | 'json' | 'yaml' | 'unknown' {
  const extension = path.extname(filePath).toLowerCase();
  
  if (['.ts', '.tsx', '.js', '.jsx'].includes(extension)) {
    return 'typescript';
  } else if (extension === '.json') {
    return 'json';
  } else if (['.yml', '.yaml'].includes(extension)) {
    return 'yaml';
  } else {
    return 'unknown';
  }
}

/**
 * Премахва коментарите от YAML файл
 * @param content - съдържание на файла
 * @returns съдържание без коментари
 */
function removeYamlComments(content: string): string {
  // Премахва редовете, които започват с '#'
  const lines = content.split('\n');
  const filteredLines = lines.map(line => {
    const commentIndex = line.indexOf('#');
    // Ако има '#' и не е част от стринг, премахваме коментара
    if (commentIndex !== -1) {
      // Проверка дали '#' не е част от стринг
      const quoteParts = line.slice(0, commentIndex).split('"');
      const singleQuoteParts = line.slice(0, commentIndex).split("'");
      
      // Ако броят на кавичките преди '#' е четен, '#' не е част от стринг
      if (
        quoteParts.length % 2 === 1 && 
        singleQuoteParts.length % 2 === 1
      ) {
        return line.slice(0, commentIndex).trimEnd();
      }
    }
    return line;
  });
  
  return filteredLines.join('\n');
}

/**
 * Премахва коментарите от JSON файл
 * Note: Стандартният JSON не поддържа коментари, но някои
 * разширения на JSON позволяват коментари като // и многоредови коментари
 * @param content - съдържание на файла
 * @returns съдържание без коментари
 */
function removeJsonComments(content: string): string {
  // Премахва стандартните JavaScript коментари
  // Това е опростена имплементация, която може да има ограничения
  return removeTypeScriptComments(content);
}

/**
 * Премахва коментарите от TypeScript/JavaScript файл
 * Работи с едноредови (//), многоредови коментари
 * и избягва случаите, когато // е част от URL в стринг
 * @param content - съдържание на файла
 * @returns съдържание без коментари
 */
function removeTypeScriptComments(content: string): string {
  const result: string[] = [];
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let inSingleQuoteString = false;
  let inDoubleQuoteString = false;
  let inTemplateString = false;
  let escape = false;
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let processedLine = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = j + 1 < line.length ? line[j + 1] : '';
      
      // Обработка на escape символи
      if (escape) {
        escape = false;
        processedLine += char;
        continue;
      }
      
      if (char === '\\' && (inSingleQuoteString || inDoubleQuoteString || inTemplateString)) {
        escape = true;
        processedLine += char;
        continue;
      }
      
      // Обработка на стрингове
      if (!inSingleLineComment && !inMultiLineComment) {
        if (char === "'" && !inDoubleQuoteString && !inTemplateString) {
          inSingleQuoteString = !inSingleQuoteString;
          processedLine += char;
          continue;
        }
        
        if (char === '"' && !inSingleQuoteString && !inTemplateString) {
          inDoubleQuoteString = !inDoubleQuoteString;
          processedLine += char;
          continue;
        }
        
        if (char === '`' && !inSingleQuoteString && !inDoubleQuoteString) {
          inTemplateString = !inTemplateString;
          processedLine += char;
          continue;
        }
      }
      
      // Ако сме в стринг, добавяме символа без промяна
      if (inSingleQuoteString || inDoubleQuoteString || inTemplateString) {
        processedLine += char;
        continue;
      }
      
      // Обработка на коментари
      if (!inSingleLineComment && !inMultiLineComment) {
        if (char === '/' && nextChar === '/') {
          inSingleLineComment = true;
          j++; // Пропускаме следващия символ
          continue;
        }
        
        if (char === '/' && nextChar === '*') {
          inMultiLineComment = true;
          j++; // Пропускаме следващия символ
          continue;
        }
      } else if (inMultiLineComment && char === '*' && nextChar === '/') {
        inMultiLineComment = false;
        j++; // Пропускаме следващия символ
        continue;
      }
      
      // Добавяме символа само ако не сме в коментар
      if (!inSingleLineComment && !inMultiLineComment) {
        processedLine += char;
      }
    }
    
    // Нов ред, едноредовият коментар приключва
    inSingleLineComment = false;
    
    // Добавяме обработения ред към резултата, ако не е празен или ако е в многоредов коментар
    if (!inMultiLineComment || processedLine.trim() !== '') {
      result.push(processedLine);
    }
  }
  
  return result.join('\n');
}

/**
 * Премахва коментарите от файл според неговия тип
 * @param content - съдържание на файла
 * @param fileType - тип на файла
 * @returns съдържание без коментари
 */
function removeComments(content: string, fileType: string): string {
  if (!options.removeComments) {
    return content;
  }
  
  switch (fileType) {
    case 'typescript':
      return removeTypeScriptComments(content);
    case 'json':
      return removeJsonComments(content);
    case 'yaml':
      return removeYamlComments(content);
    default:
      return content; // За неизвестни типове файлове, запазваме съдържанието непроменено
  }
}

/**
 * Обработва път към файл, за да покаже само частта след ROOT папката
 * @param filePath - пълният път към файла
 * @returns относителният път след ROOT папката или оригиналния път ако ROOT папката не е намерена
 */
function processFilePath(filePath: string): string {
  // Ако няма зададена ROOT папка, връща оригиналния път
  if (!options.rootFolder) {
    return filePath;
  }
  
  // Нормализираме пътищата, за да работим с унифициран формат, без значение дали е Windows или Unix
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedRootFolder = options.rootFolder.replace(/\\/g, '/');
  
  // Търсим позицията на ROOT папката в пътя
  const rootFolderIndex = normalizedPath.indexOf(normalizedRootFolder);
  
  if (rootFolderIndex === -1) {
    // Ако ROOT папката не е намерена в пътя, връщаме оригиналния път
    console.warn(`ROOT папката '${options.rootFolder}' не е намерена в път '${filePath}'`);
    return filePath;
  }
  
  // Изчисляваме началото на относителния път (след ROOT папката)
  const startRelativePath = rootFolderIndex + normalizedRootFolder.length + 1; // +1 за / или \ след папката
  
  // Извличаме относителния път
  const relativePath = normalizedPath.slice(startRelativePath);
  
  return relativePath;
}

/**
 * Проверява дали даден път е директория
 * @param filePath - път за проверка
 * @returns true ако е директория, false ако не е или не съществува
 */
function isDirectory(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Проверява дали файл трябва да бъде изключен според шаблоните за изключване
 * @param filePath - път към файла
 * @param patterns - списък с шаблони за изключване
 * @returns true ако файлът трябва да бъде изключен
 */
function shouldExcludeFile(filePath: string, patterns: string[]): boolean {
  // Нормализираме пътя
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = path.basename(normalizedPath);
  
  for (const pattern of patterns) {
    // Нормализираме шаблона
    const normalizedPattern = pattern.replace(/\\/g, '/');
    
    // Проверка за директно съвпадение на пътищата
    if (normalizedPath === normalizedPattern || normalizedPath.endsWith('/' + normalizedPattern)) {
      return true;
    }
    
    // Проверка за съвпадение на имената на файловете
    if (fileName === normalizedPattern) {
      return true;
    }
    
    // Проверка за шаблон с *
    if (normalizedPattern.includes('*')) {
      const regexPattern = normalizedPattern
        .replace(/\./g, '\\.')   // Escape за точки
        .replace(/\*/g, '.*');   // * се заменя с .*
      
      const regex = new RegExp(`^${regexPattern}$`);
      
      if (regex.test(fileName)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Зарежда списък с файлове за изключване от файл
 * @param excludeFilePath - път към файла със списък с файлове за изключване
 * @returns списък с шаблони за изключване
 */
function loadExcludePatterns(excludeFilePath: string): string[] {
  try {
    if (!fs.existsSync(excludeFilePath)) {
      console.warn(`Файлът със списък за изключване '${excludeFilePath}' не е намерен.`);
      return [];
    }
    
    console.log(`Зареждане на шаблони от файл: ${excludeFilePath}`);
    
    const content = readFileContent(excludeFilePath);
    const patterns = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    console.log(`Заредени ${patterns.length} шаблона за изключване.`);
    return patterns;
  } catch (error) {
    console.warn(`Грешка при четене на файла със списък за изключване: ${error}`);
    return [];
  }
}

/**
 * Парсира аргументите от командния ред
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--keep-comments') {
      options.removeComments = false;
    } 
    else if (arg === '--root-folder' && i + 1 < args.length) {
      options.rootFolder = args[i + 1];
      i++; // Пропускаме следващия аргумент, тъй като го използвахме като стойност
    }
    else if (arg.startsWith('--root-folder=')) {
      options.rootFolder = arg.split('=')[1];
    }
    else if (arg === '--files-list' && i + 1 < args.length) {
      options.filesListFile = args[i + 1];
      i++; // Пропускаме следващия аргумент
    }
    else if (arg.startsWith('--files-list=')) {
      options.filesListFile = arg.split('=')[1];
    }
    else if (arg === '--output-file' && i + 1 < args.length) {
      options.outputFile = args[i + 1];
      i++; // Пропускаме следващия аргумент
    }
    else if (arg.startsWith('--output-file=')) {
      options.outputFile = arg.split('=')[1];
    }
    else if (arg === '--process-directories') {
      options.skipDirectories = false;
    }
    else if (arg === '--skip-directories') {
      options.skipDirectories = true;
    }
    else if (arg === '--exclude' && i + 1 < args.length) {
      options.excludedFiles.push(args[i + 1]);
      i++; // Пропускаме следващия аргумент
    }
    else if (arg.startsWith('--exclude=')) {
      options.excludedFiles.push(arg.split('=')[1]);
    }
    else if (arg === '--exclude-from' && i + 1 < args.length) {
      options.excludeFromFile = args[i + 1];
      i++; // Пропускаме следващия аргумент
    }
    else if (arg.startsWith('--exclude-from=')) {
      options.excludeFromFile = arg.split('=')[1];
    }
    else if (arg === '--exclude-default') {
      options.excludedFiles = options.excludedFiles.concat(defaultExcludedFiles);
    }
    else if (arg === '--no-exclude-default') {
      // Опция за изключване на стандартните файлове за изключване
      // Нищо не правим, тъй като по подразбиране не са добавени
    }
  }
  
  // Показваме информация за настройките
  console.log(`Входен файл със списъци: '${options.filesListFile}'`);
  console.log(`Изходен файл: '${options.outputFile}'`);
  console.log(`Пропускане на директории: ${options.skipDirectories ? 'Да' : 'Не'}`);
  
  if (options.rootFolder && options.rootFolder.trim() !== '') {
    console.log(`ROOT папка зададена на: '${options.rootFolder}'`);
  }
  
  if (options.excludedFiles.length > 0) {
    console.log(`Изключени файлове: ${options.excludedFiles.join(', ')}`);
  }
  
  if (options.excludeFromFile) {
    console.log(`Файл със списък за изключване: '${options.excludeFromFile}'`);
  }
}

/**
 * Разрешава пътя към файл, като търси в root директорията, ако е зададена
 * @param filePath - път към файла, може да е абсолютен или относителен
 * @returns абсолютен път към файла
 */
function resolveFilePath(filePath: string): string {
  // Ако пътят е абсолютен, връщаме го директно
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  
  // Списък с възможни директории, в които да търсим файла
  const searchPaths = [];
  
  // Ако е зададена rootFolder, търсим и спрямо нея
  if (options.rootFolder) {
    // Първо търсим в rootFolder директно (ако rootFolder е абсолютен път)
    if (path.isAbsolute(options.rootFolder)) {
      searchPaths.push(path.join(options.rootFolder, filePath));
    }
    
    // Търсим в rootDir/rootFolder/filePath
    searchPaths.push(path.join(rootDir, options.rootFolder, filePath));
    
    // Търсим рекурсивно във всички директории, които съдържат rootFolder
    const getParentDirectories = (dir: string, maxDepth = 5): string[] => {
      const results: string[] = [];
      const parts = dir.split(path.sep);
      
      // Ограничаваме дълбочината на търсене
      for (let i = 0; i < Math.min(parts.length, maxDepth); i++) {
        const candidateDir = parts.slice(0, parts.length - i).join(path.sep);
        results.push(candidateDir);
      }
      
      return results;
    };
    
    // Намираме всички родителски директории на rootDir
    const parentDirs = getParentDirectories(rootDir);
    
    // Добавяме варианти с rootFolder в тези директории
    for (const parentDir of parentDirs) {
      searchPaths.push(path.join(parentDir, options.rootFolder, filePath));
    }
  }
  
  // Накрая винаги търсим относително спрямо текущата директория
  searchPaths.push(path.join(rootDir, filePath));
  
  // Търсим в различните възможни пътища
  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      return searchPath;
    }
  }
  
  // Ако не намерим файла, връщаме първия търсен път като стойност по подразбиране
  return searchPaths[0];
}

/**
 * Основна функция на програмата
 */
async function main() {
  try {
    // Парсираме аргументите от командния ред
    parseCommandLineArgs();
    
    // Определяне на пътищата въз основа на подадените опции
    const filesListPath = resolveFilePath(options.filesListFile);
    const promptFilePath = path.join(rootDir, options.outputFile);
    
    // Проверка дали съществува файлът със списъка
    if (!fs.existsSync(filesListPath)) {
      console.error(`Файлът '${options.filesListFile}' не е намерен!`);
      console.error(`Търсено в: ${filesListPath}`);
      
      if (options.rootFolder) {
        console.error(`Опитайте да зададете пълния път до списъка с файлове или проверете стойността на параметъра --root-folder (${options.rootFolder})`);
      }
      
      process.exit(1);
    }

    console.log(`Използван файл със списък: ${filesListPath}`);

    // Зареждаме допълнителни шаблони за изключване от файл, ако е зададен
    let excludePatterns = [...options.excludedFiles];
    if (options.excludeFromFile) {
      const excludeFilePath = resolveFilePath(options.excludeFromFile);
      excludePatterns = excludePatterns.concat(loadExcludePatterns(excludeFilePath));
    }

    // Чете списъка с файлове
    const filesList = readFileContent(filesListPath)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // Премахва празни редове и коментари

    console.log(`Намерени ${filesList.length} записа в списъка.`);
    console.log(`Премахване на коментари: ${options.removeComments ? 'Да' : 'Не'}`);

    // Изчиства или създава изходния файл
    fs.writeFileSync(promptFilePath, '');

    // Добавя съдържанието на всеки файл към изходния файл
    let combinedContent = '';
    let processedFiles = 0;
    let skippedFiles = 0;
    let notFoundFiles = 0;
    
    // Запазваме информация за всички проверени пътища за отстраняване на грешки
    const checkedPaths: Record<string, string[]> = {};
    
    for (const filePath of filesList) {
      // Използваме разширената функция за намиране на файлове
      // като вземем предвид rootFolder
      const resolvedPath = resolveFilePath(filePath);
      
      checkedPaths[filePath] = [resolvedPath];
      
      // Ако пътят е абсолютен, използваме го директно
      let absolutePath = resolvedPath;
      
      // Проверка дали файлът съществува
      if (!fs.existsSync(absolutePath)) {
        console.warn(`Пропуснат файл (не съществува): ${filePath}`);
        console.warn(`  Опитан път: ${absolutePath}`);
        skippedFiles++;
        notFoundFiles++;
        continue;
      }
      
      // Проверка дали е директория
      if (options.skipDirectories && isDirectory(absolutePath)) {
        console.log(`Пропусната директория: ${filePath}`);
        skippedFiles++;
        continue;
      }
      
      // Проверка дали файлът трябва да бъде изключен
      if (shouldExcludeFile(filePath, excludePatterns)) {
        console.log(`Пропуснат файл (изключен): ${filePath}`);
        skippedFiles++;
        continue;
      }
      
      // Обработка на файла
      const fileContent = readFileContent(absolutePath);
      const fileType = getFileType(absolutePath);
      
      // Премахва коментарите според типа на файла
      const processedContent = removeComments(fileContent, fileType);
      
      // Обработва пътя според настройката за ROOT папка
      const displayPath = processFilePath(filePath);
      
      combinedContent += `\n${displayPath}:\n`;
      combinedContent += processedContent;
      combinedContent += '\n\n';
      console.log(`Добавен файл: ${displayPath} (тип: ${fileType})`);
      processedFiles++;
    }

    // Записва събраното съдържание в изходния файл
    fs.writeFileSync(promptFilePath, combinedContent.trim());
    console.log(`Обработка завършена: ${processedFiles} файла добавени, ${skippedFiles} файла пропуснати (от тях ${notFoundFiles} не са намерени).`);
    
    // Ако има много ненамерени файлове, извеждаме съвет
    if (notFoundFiles > 5 && options.rootFolder) {
      console.log(`\nСъвет: Много файлове не бяха намерени. Проверете дали директорията '${options.rootFolder}' е правилно зададена и съдържа файловете от списъка.`);
      console.log(`Вие можете да зададете абсолютния път до проекта с '--root-folder=/пълен/път/до/проекта'`);
    }
    
    console.log(`Всички файлове са копирани успешно в '${options.outputFile}'`);
  } catch (error) {
    console.error('Възникна грешка:', error);
    process.exit(1);
  }
}

// Изпълнява основната функция
main();