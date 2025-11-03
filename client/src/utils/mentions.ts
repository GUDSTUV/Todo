/**
 * Highlights @mentions in text with special styling
 */
export const highlightMentions = (text: string): string => {
  return text.replace(
    /@(\w+)/g,
    '<span class="mention">@$1</span>'
  );
};

/**
 * Extract usernames from @mentions in text
 */
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};
