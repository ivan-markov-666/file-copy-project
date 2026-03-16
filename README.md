# Project Directory and File Content Scanner

---

# Collecting All Directories and File Contents from a Project into a Single File

This project provides an easy way to collect the text content of all files and directories from a project into a single file. The final result can easily be passed to any LLM model to assist with faster code development.

**Note:**  
- This is a NodeJS-based project. You need to have NodeJS installed on your system.  
- After cloning the repository, run `npm install` to install all dependencies.  
- The scanner can process any project (not only NodeJS projects).

## How it works:

To run the project, use the following command:
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "C:\projects\mproject-root-folder\blacklist.txt" --output "output.txt" --env --strip-comments
```

As you can see, there are five types of arguments we can provide:

- `--dir` or `-d` - provide the path to the project we want to scan
- `--blacklist` or `-b` - provide the path to the blacklist.txt file, where we can specify directories and files to skip
- `--output` or `-o` - provide the path to the file where we want to save the content of all files and directories
- `--env` or `-e` - flag that indicates whether to include the content of .env files (by default, they are skipped)
- `--strip-comments` or `-s` - flag that indicates whether to remove comments from source code files (by default, comments are kept)

---

## Usage Examples:

### Standard scanning (without .env files):
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "blacklist.txt" --output "output.txt"
```

### Scanning with .env files included (using -e or --env flag):
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "blacklist.txt" --output "output.txt" --env
```

### Scanning with comment stripping (using -s or --strip-comments flag):
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "blacklist.txt" --output "output.txt" --strip-comments
```

### Scanning with both .env files and comment stripping:
```
npm run scanner -- --dir "C:\projects\mproject-root-folder" --blacklist "blacklist.txt" --output "output.txt" --env --strip-comments
```

## .env File Processing:

By default, the program skips the content of .env files to protect sensitive information (keys, passwords, tokens, etc.). When the `--env` parameter is added, .env files are included in the output file with special formatting for better visibility:

```
### Content of .env file ###
API_KEY=your_secret_key
DATABASE_URL=your_database_connection_string
### End of .env file ###
```

## Comment Stripping:

By default, the program keeps all comments in the source code. When the `--strip-comments` parameter is added, comments are removed from supported file types before writing to the output file. This is useful when you want to reduce the output size and focus only on the actual code.

Comment stripping is powered by the [comment-bear](https://www.npmjs.com/package/comment-bear) package and supports the following languages: JavaScript, TypeScript, Python, Ruby, Java, C#, C, C++, HTML, CSS, SQL, YAML, JSON, XML, PHP, Go, Rust, and Swift.

For unsupported file types, the content is included as-is without modification.

## Additional Options:

To see all available options, run:
```
npm run scanner -- --help
```
