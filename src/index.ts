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
}

// Глобални опции със стойности по подразбиране
const options: Options = {
  removeComments: true,
  rootFolder: null,
  filesListFile: 'files-list.txt', // По подразбиране
  outputFile: 'prompt.txt', // По подразбиране
};

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
  }
  
  // Показваме информация за настройките
  console.log(`Входен файл със списъци: '${options.filesListFile}'`);
  console.log(`Изходен файл: '${options.outputFile}'`);
  
  if (options.rootFolder && options.rootFolder.trim() !== '') {
    console.log(`ROOT папка зададена на: '${options.rootFolder}'`);
  }
}

/**
 * Основна функция на програмата
 */
async function main() {
  try {
    // Парсираме аргументите от командния ред
    parseCommandLineArgs();
    
    // Определяне на пътищата въз основа на подадените опции
    const filesListPath = path.join(rootDir, options.filesListFile);
    const promptFilePath = path.join(rootDir, options.outputFile);
    
    // Проверка дали съществува файлът със списъка
    if (!fs.existsSync(filesListPath)) {
      console.error(`Файлът '${options.filesListFile}' не е намерен в директорията на проекта!`);
      process.exit(1);
    }

    // Чете списъка с файлове
    const filesList = readFileContent(filesListPath)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // Премахва празни редове и коментари

    console.log(`Намерени ${filesList.length} файла за обработка.`);
    console.log(`Премахване на коментари: ${options.removeComments ? 'Да' : 'Не'}`);

    // Изчиства или създава изходния файл
    fs.writeFileSync(promptFilePath, '');

    // Добавя съдържанието на всеки файл към изходния файл
    let combinedContent = '';
    for (const filePath of filesList) {
      const absolutePath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(rootDir, filePath);
      
      if (fs.existsSync(absolutePath)) {
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
      } else {
        console.warn(`Пропуснат файл (не съществува): ${filePath}`);
      }
    }

    // Записва събраното съдържание в изходния файл
    fs.writeFileSync(promptFilePath, combinedContent.trim());
    console.log(`Всички файлове са копирани успешно в '${options.outputFile}'`);
  } catch (error) {
    console.error('Възникна грешка:', error);
    process.exit(1);
  }
}

// Изпълнява основната функция
main();