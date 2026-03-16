import { removeComments } from 'comment-bear';
import { detectLanguageByFilename } from 'comment-bear';

/**
 * Strip comments from file content using comment-bear
 * @param content File content
 * @param filePath Path to the file (used for language detection)
 * @returns Content without comments, or original content if language is unsupported
 */
export function stripCommentsFromFile(content: string, filePath: string): string {
  try {
    const result = removeComments(content, {
      filename: filePath,
      preserveLicense: false,
      keepEmptyLines: false
    });

    if (result.removedCount > 0 && process.env.DEBUG) {
      console.log(`Stripped ${result.removedCount} comments from ${filePath} (detected: ${result.detectedLanguage || 'unknown'})`);
    }

    return result.code;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.warn(`Warning: Failed to strip comments from ${filePath}: ${error.message}`);
    }
    return content;
  }
}

/**
 * Check if a file's language is supported for comment stripping
 * @param filePath Path to the file
 * @returns true if the file type is supported by comment-bear
 */
export function isCommentStrippingSupported(filePath: string): boolean {
  try {
    const lang = detectLanguageByFilename(filePath);
    return lang !== undefined;
  } catch {
    return false;
  }
}
