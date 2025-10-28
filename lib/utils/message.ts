/**
 * Utility functions for working with AI SDK messages
 */

/**
 * Generic message part that could be of any type
 */
export interface MessagePart {
  type: string;
  [key: string]: unknown;
}

/**
 * Text part from AI SDK message
 */
export interface TextPart extends MessagePart {
  type: 'text';
  text: string;
}

/**
 * Type guard to check if a part is a TextPart
 * @param part - Message part to check
 * @returns True if the part is a TextPart
 */
export function isTextPart(part: MessagePart): part is TextPart {
  return (
    part.type === 'text' &&
    'text' in part &&
    typeof part.text === 'string'
  );
}

/**
 * Type guard to check if an object has a parts array
 * @param obj - Object to check
 * @returns True if the object has a parts array
 */
export function hasPartsArray(obj: unknown): obj is { parts: MessagePart[] } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'parts' in obj &&
    Array.isArray((obj as { parts: unknown }).parts)
  );
}

/**
 * Extracts text content from a message with parts
 * @param message - Message object with parts array
 * @returns Concatenated text from all text parts
 */
export function extractTextContent(
  message: { parts?: MessagePart[] } | unknown
): string {
  if (!hasPartsArray(message)) {
    return '';
  }

  return message.parts
    .filter(isTextPart)
    .map((part) => part.text)
    .join('');
}
