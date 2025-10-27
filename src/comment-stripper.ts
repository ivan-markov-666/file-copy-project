import * as path from 'path';
import decomment from 'decomment';
import stripJsonComments from 'strip-json-comments';

/**
 * Supported file types for comment stripping
 */
export enum FileType {
  JAVASCRIPT,
  TYPESCRIPT,
  JAVA,
  CSHARP,
  PHP,
  SQL,
  JSON,
  UNSUPPORTED
}

/**
 * Determine file type based on extension
 * @param filePath Path to the file
 * @returns FileType enum value
 */
export function getFileType(filePath: string): FileType {
  const ext = path.extname(filePath).toLowerCase();
  
  const typeMap: { [key: string]: FileType } = {
    '.js': FileType.JAVASCRIPT,
    '.jsx': FileType.JAVASCRIPT,
    '.ts': FileType.TYPESCRIPT,
    '.tsx': FileType.TYPESCRIPT,
    '.java': FileType.JAVA,
    '.cs': FileType.CSHARP,
    '.php': FileType.PHP,
    '.sql': FileType.SQL,
    '.json': FileType.JSON
  };
  
  return typeMap[ext] || FileType.UNSUPPORTED;
}

/**
 * Remove excessive empty lines from content
 * Reduces multiple consecutive empty lines to a single empty line
 * @param content File content
 * @returns Content with reduced empty lines
 */
function removeExcessiveEmptyLines(content: string): string {
  // First, remove lines that contain only whitespace (spaces, tabs)
  let result = content.replace(/^[ \t]+$/gm, '');
  
  // Then reduce multiple consecutive empty lines to maximum one empty line
  result = result.replace(/(\r?\n){3,}/g, '\n\n');
  
  return result;
}

/**
 * Strip SQL comments from content
 * @param content SQL file content
 * @returns Content without comments
 */
function stripSqlComments(content: string): string {
  // Remove single-line comments (-- comment)
  let result = content.replace(/--[^\n]*/g, '');
  
  // Remove multi-line comments (/* comment */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove excessive empty lines
  result = removeExcessiveEmptyLines(result);
  
  return result;
}

/**
 * Strip comments from file content based on file type
 * @param content File content
 * @param fileType Type of the file
 * @returns Content without comments or original content if unsupported
 */
export function stripComments(content: string, fileType: FileType): string {
  try {
    let result: string;
    
    switch (fileType) {
      case FileType.JAVASCRIPT:
      case FileType.TYPESCRIPT:
        // decomment handles JS/TS with JSX/TSX
        result = decomment(content, {
          trim: false,
          safe: true
        });
        break;
      
      case FileType.JAVA:
        // decomment handles Java C-style comments
        result = decomment(content, {
          trim: false,
          safe: true
        });
        break;
      
      case FileType.CSHARP:
        // decomment handles C# C-style comments
        result = decomment(content, {
          trim: false,
          safe: true
        });
        break;
      
      case FileType.PHP:
        // decomment handles PHP comments (both // and # style)
        result = decomment(content, {
          trim: false,
          safe: true
        });
        break;
      
      case FileType.SQL:
        // Use custom SQL comment stripper (already removes excessive lines)
        return stripSqlComments(content);
      
      case FileType.JSON:
        // strip-json-comments handles JSON with comments
        result = stripJsonComments(content, { whitespace: true });
        break;
      
      case FileType.UNSUPPORTED:
      default:
        // Return original content for unsupported file types
        return content;
    }
    
    // Remove excessive empty lines for all supported types (except SQL which already does this)
    result = removeExcessiveEmptyLines(result);
    
    return result;
  } catch (error: unknown) {
    // If comment stripping fails, return original content
    if (error instanceof Error) {
      console.warn(`Warning: Failed to strip comments: ${error.message}`);
    }
    return content;
  }
}

/**
 * Check if file type is supported for comment stripping
 * @param fileType Type of the file
 * @returns true if supported, false otherwise
 */
export function isSupported(fileType: FileType): boolean {
  return fileType !== FileType.UNSUPPORTED;
}

/**
 * Get human-readable name for file type
 * @param fileType Type of the file
 * @returns File type name
 */
export function getFileTypeName(fileType: FileType): string {
  const names: { [key in FileType]: string } = {
    [FileType.JAVASCRIPT]: 'JavaScript',
    [FileType.TYPESCRIPT]: 'TypeScript',
    [FileType.JAVA]: 'Java',
    [FileType.CSHARP]: 'C#',
    [FileType.PHP]: 'PHP',
    [FileType.SQL]: 'SQL',
    [FileType.JSON]: 'JSON',
    [FileType.UNSUPPORTED]: 'Unsupported'
  };
  
  return names[fileType];
}