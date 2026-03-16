"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCommentStrippingSupported = exports.stripCommentsFromFile = void 0;
const comment_bear_1 = require("comment-bear");
const comment_bear_2 = require("comment-bear");
/**
 * Strip comments from file content using comment-bear
 * @param content File content
 * @param filePath Path to the file (used for language detection)
 * @returns Content without comments, or original content if language is unsupported
 */
function stripCommentsFromFile(content, filePath) {
    try {
        const result = (0, comment_bear_1.removeComments)(content, {
            filename: filePath,
            preserveLicense: false,
            keepEmptyLines: false
        });
        if (result.removedCount > 0 && process.env.DEBUG) {
            console.log(`Stripped ${result.removedCount} comments from ${filePath} (detected: ${result.detectedLanguage || 'unknown'})`);
        }
        return result.code;
    }
    catch (error) {
        if (error instanceof Error) {
            console.warn(`Warning: Failed to strip comments from ${filePath}: ${error.message}`);
        }
        return content;
    }
}
exports.stripCommentsFromFile = stripCommentsFromFile;
/**
 * Check if a file's language is supported for comment stripping
 * @param filePath Path to the file
 * @returns true if the file type is supported by comment-bear
 */
function isCommentStrippingSupported(filePath) {
    try {
        const lang = (0, comment_bear_2.detectLanguageByFilename)(filePath);
        return lang !== undefined;
    }
    catch {
        return false;
    }
}
exports.isCommentStrippingSupported = isCommentStrippingSupported;
