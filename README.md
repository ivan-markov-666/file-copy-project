# Project Directory and File Content Scanner

**Languages:** [🇺🇸 English](#english) | [🇩🇪 Deutsch](#deutsch) | [🇧🇬 Български](#български)

---

## English

# Collecting All Directories and File Contents from a Project into a Single File

This project provides an easy way to collect the text content of all files and directories from a project into a single file. The final result can easily be passed to any LLM model to assist with faster code development.

**Note:**  
- This is a NodeJS-based project. You need to have NodeJS installed on your system.  
- After cloning the repository, run `npm install` to install all dependencies.  
- The scanner can process any type of project (not only NodeJS projects).

## How it works:

To run the project, use the following command:
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "C:\projects\mproject-root-folder\blacklist.txt" --output "output.txt" --env
```
```
npm run scanner -- --dir "D:\courses\my\QA\project\be\qa-4-free" --blacklist "D:\courses\my\QA\project\be\qa-4-free-files-to-prompt\blacklist.txt" --output "output.txt" --env
```

As you can see, there are four types of arguments we can provide:

- `--dir` or `-d` - provide the path to the project we want to scan
- `--blacklist` or `-b` - provide the path to the blacklist.txt file where we can specify directories and files to skip
- `--output` or `-o` - provide the path to the file where we want to save the content of all files and directories
- `--env` or `-e` - flag that indicates whether to include the content of .env files (by default they are skipped)

## Usage Examples:

### Standard scanning (without .env files):
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "blacklist.txt" --output "output.txt"
```

### Scanning with .env files included:
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "blacklist.txt" --output "output.txt" --env
```

## .env File Processing:

By default, the program skips the content of .env files to protect sensitive information (keys, passwords, tokens, etc.). When the `--env` parameter is added, .env files are included in the output file with special formatting for better visibility:

```
### Content of .env file ###
API_KEY=your_secret_key
DATABASE_URL=your_database_connection_string
### End of .env file ###
```

## Additional Options:

To see all available options, run:
```
npm run scanner -- --help
```

---

## Deutsch

# Sammeln aller Verzeichnisse und Dateiinhalte aus einem Projekt in eine einzige Datei

Dieses Projekt bietet eine einfache Möglichkeit, den Textinhalt aller Dateien und Verzeichnisse aus einem Projekt in eine einzige Datei zu sammeln. Das Endergebnis kann einfach an jedes LLM-Modell weitergegeben werden, um bei der schnelleren Code-Entwicklung zu helfen.

**Hinweis:**  
- Dieses Projekt basiert auf NodeJS. NodeJS muss auf Ihrem System installiert sein.  
- Nach dem Klonen des Repositories führen Sie bitte `npm install` aus, um alle Abhängigkeiten zu installieren.  
- Der Scanner kann beliebige Projekttypen verarbeiten (nicht nur NodeJS-Projekte).

## Funktionsweise:

Um das Projekt auszuführen, verwenden Sie den folgenden Befehl:
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "C:\projects\mproject-root-folder\blacklist.txt" --output "output.txt" --env
```

Wie Sie sehen können, gibt es vier Arten von Argumenten, die wir bereitstellen können:

- `--dir` oder `-d` - Pfad zum Projekt angeben, das wir scannen möchten
- `--blacklist` oder `-b` - Pfad zur blacklist.txt-Datei angeben, in der wir Verzeichnisse und Dateien zum Überspringen festlegen können
- `--output` oder `-o` - Pfad zur Datei angeben, in der wir den Inhalt aller Dateien und Verzeichnisse speichern möchten
- `--env` oder `-e` - Flag, das angibt, ob der Inhalt von .env-Dateien einbezogen werden soll (standardmäßig werden sie übersprungen)

## Verwendungsbeispiele:

### Standardscannen (ohne .env-Dateien):
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "blacklist.txt" --output "output.txt"
```

### Scannen mit einbezogenen .env-Dateien:
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "blacklist.txt" --output "output.txt" --env
```

## .env-Datei-Verarbeitung:

Standardmäßig überspringt das Programm den Inhalt von .env-Dateien zum Schutz sensibler Informationen (Schlüssel, Passwörter, Token usw.). Wenn der Parameter `--env` hinzugefügt wird, werden .env-Dateien in die Ausgabedatei mit spezieller Formatierung für bessere Sichtbarkeit einbezogen:

```
### Inhalt der .env-Datei ###
API_KEY=your_secret_key
DATABASE_URL=your_database_connection_string
### Ende der .env-Datei ###
```

## Zusätzliche Optionen:

Um alle verfügbaren Optionen zu sehen, führen Sie aus:
```
npm run scanner -- --help
```

---

## Български

# Вземане на всички директории и съдържание на файлове от проект и събирането им в един файл

Този проект предоставя улеснен начин за събирането на текстовото съдържание на всички файлове и директории от проекта в един файл. Крайния резултат може лесно да се предаде към някой LLM модел, който да спомогне за по-бързото разработване на код.

**Забележка:**  
- Проектът е базиран на NodeJS. Необходимо е да имате инсталиран NodeJS на вашата система.  
- След като клонирате репозиторито, изпълнете `npm install`, за да инсталирате всички зависимости.  
- Сканиращият инструмент може да обработва всякакви проекти (не само NodeJS проекти).

## Как работи:

За да се пусне проекта, трябва да използваме следната команда:
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "C:\projects\mproject-root-folder\blacklist.txt" --output "output.txt" --env
```

Както се вижда има четири вида аргумента които можем да предоставим:

- `--dir` или `-d` - трябва да предоставим пътят до проекта, който ще сканираме
- `--blacklist` или `-b` - трябва да предоставим пътя до blacklist.txt файла, където да поставим директориите и файловете които искаме да пропуснем
- `--output` или `-o` - трябва да предоставим пътя до файла, където да запишем съдържанието на всички файлове и директории
- `--env` или `-e` - флаг, който показва дали да се включи съдържанието на .env файловете (по подразбиране те се пропускат)

## Примери за използване:

### Стандартно сканиране (без .env файлове):
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "blacklist.txt" --output "output.txt"
```

### Сканиране с включени .env файлове:
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "blacklist.txt" --output "output.txt" --env
```

## Обработка на .env файлове:

По подразбиране програмата пропуска съдържанието на .env файловете с цел защита на чувствителна информация (ключове, пароли, токени и др.). Когато параметърът `--env` е добавен, .env файловете се включват в изходния файл със специално форматиране за по-добра видимост:

```
### Съдържание на .env файл ###
API_KEY=your_secret_key
DATABASE_URL=your_database_connection_string
### Край на .env файл ###
```

## Допълнителни опции:

За да видите всички налични опции, изпълнете:
```
npm run scanner -- --help
```
