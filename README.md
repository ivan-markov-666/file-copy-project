# Project Directory and File Content Scanner

---

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

As you can see, there are four types of arguments we can provide:

- `--dir` or `-d` - provide the path to the project we want to scan
- `--blacklist` or `-b` - provide the path to the blacklist.txt file where we can specify directories and files to skip
- `--output` or `-o` - provide the path to the file where we want to save the content of all files and directories
- `--env` or `-e` - flag that indicates whether to include the content of .env files (by default they are skipped)

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
