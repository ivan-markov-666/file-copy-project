import * as fs from 'fs';
import * as path from 'path';

// Пътища към файловете
const rootDir = process.cwd();
const filesListPath = path.join(rootDir, 'files-list.txt');
const promptFilePath = path.join(rootDir, 'prompt.txt');

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
 * Основна функция на програмата
 */
async function main() {
  try {
    // Проверка дали съществува files-list.txt
    if (!fs.existsSync(filesListPath)) {
      console.error('Файлът files-list.txt не е намерен в директорията на проекта!');
      process.exit(1);
    }

    // Чете списъка с файлове
    const filesList = readFileContent(filesListPath)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // Премахва празни редове и коментари

    console.log(`Намерени ${filesList.length} файла за обработка.`);

    // Изчиства или създава prompt.txt
    fs.writeFileSync(promptFilePath, '');

    // Добавя съдържанието на всеки файл към prompt.txt
    let combinedContent = '';
    for (const filePath of filesList) {
      const absolutePath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(rootDir, filePath);
      
      if (fs.existsSync(absolutePath)) {
        const content = readFileContent(absolutePath);
        combinedContent += `\n${filePath}:\n`;
        combinedContent += content;
        combinedContent += '\n\n';
        console.log(`Добавен файл: ${filePath}`);
      } else {
        console.warn(`Пропуснат файл (не съществува): ${filePath}`);
      }
    }

    // Записва събраното съдържание в prompt.txt
    fs.writeFileSync(promptFilePath, combinedContent.trim());
    console.log(`Всички файлове са копирани успешно в ${promptFilePath}`);
  } catch (error) {
    console.error('Възникна грешка:', error);
    process.exit(1);
  }
}

// Изпълнява основната функция
main();