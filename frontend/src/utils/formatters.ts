import { DocumentFile } from '../types';

export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30);
    const years = Math.round(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

export const groupDocumentsByMonth = (documents: DocumentFile[]): { [key: string]: DocumentFile[] } => {
    return documents.reduce((acc, doc) => {
        const date = doc.uploadDate;
        const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
        
        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        acc[monthYear].push(doc);
        return acc;
    }, {} as { [key: string]: DocumentFile[] });
};

export const renderMarkdown = (text: string): string => {
  const processInlineFormatting = (line: string) => {
    return line
      // Inline code (must come before bold/italic to avoid conflicts)
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">$1</code>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic (but not if it's a list marker)
      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
  };

  const cleanedText = text.replace(/\\n/g, '\n');
  const lines = cleanedText.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      i++;
      continue;
    }

    // Headings
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = processInlineFormatting(headingMatch[2]);
      const sizeClasses = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-sm'];
      const marginClasses = ['mt-6 mb-4', 'mt-5 mb-3', 'mt-4 mb-2', 'mt-3 mb-2', 'mt-2 mb-1', 'mt-2 mb-1'];
      result.push(`<h${level} class="font-bold ${sizeClasses[level - 1]} ${marginClasses[level - 1]}">${content}</h${level}>`);
      i++;
      continue;
    }

    // Unordered lists (with nested support)
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      const listLines: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('* ') || lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('  '))) {
        listLines.push(lines[i]);
        i++;
      }
      result.push(parseUnorderedList(listLines, processInlineFormatting));
      continue;
    }

    // Ordered lists (with nested support)
    if (/^\d+\.\s/.test(trimmedLine)) {
      const listLines: string[] = [];
      while (i < lines.length && (/^\d+\.\s/.test(lines[i].trim()) || lines[i].trim().startsWith('  '))) {
        listLines.push(lines[i]);
        i++;
      }
      result.push(parseOrderedList(listLines, processInlineFormatting));
      continue;
    }

    // Code blocks
    if (trimmedLine.startsWith('```')) {
      const codeLines: string[] = [];
      i++; // Skip opening ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      const code = codeLines.join('\n');
      result.push(`<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono">${escapeHtml(code)}</code></pre>`);
      continue;
    }

    // Regular paragraph - collect consecutive non-list, non-heading lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('* ') &&
      !lines[i].trim().startsWith('- ') &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('```')
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      const paragraphContent = processInlineFormatting(paraLines.join(' '));
      result.push(`<p class="my-3">${paragraphContent}</p>`);
    }
  }

  return result.join('');
};

// Helper function to parse unordered lists with nesting
function parseUnorderedList(lines: string[], processInlineFormatting: (text: string) => string): string {
  const items: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const content = trimmed.substring(2).trim();

      // Check for nested list
      const nestedLines: string[] = [];
      while (i + 1 < lines.length && lines[i + 1].search(/\S/) > indent) {
        nestedLines.push(lines[i + 1]);
        i++;
      }

      let itemContent = processInlineFormatting(content);
      if (nestedLines.length > 0) {
        // Determine if nested list is ordered or unordered
        const firstNested = nestedLines[0].trim();
        if (/^\d+\.\s/.test(firstNested)) {
          itemContent += parseOrderedList(nestedLines, processInlineFormatting);
        } else {
          itemContent += parseUnorderedList(nestedLines, processInlineFormatting);
        }
      }

      items.push(`<li class="ml-4">${itemContent}</li>`);
    }
    i++;
  }

  return `<ul class="list-disc list-inside my-3">${items.join('')}</ul>`;
}

// Helper function to parse ordered lists with nesting
function parseOrderedList(lines: string[], processInlineFormatting: (text: string) => string): string {
  const items: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    const match = trimmed.match(/^\d+\.\s(.+)$/);
    if (match) {
      const content = match[1].trim();

      // Check for nested list
      const nestedLines: string[] = [];
      while (i + 1 < lines.length && lines[i + 1].search(/\S/) > indent) {
        nestedLines.push(lines[i + 1]);
        i++;
      }

      let itemContent = processInlineFormatting(content);
      if (nestedLines.length > 0) {
        // Determine if nested list is ordered or unordered
        const firstNested = nestedLines[0].trim();
        if (/^\d+\.\s/.test(firstNested)) {
          itemContent += parseOrderedList(nestedLines, processInlineFormatting);
        } else {
          itemContent += parseUnorderedList(nestedLines, processInlineFormatting);
        }
      }

      items.push(`<li class="ml-4">${itemContent}</li>`);
    }
    i++;
  }

  return `<ol class="list-decimal list-inside my-3">${items.join('')}</ol>`;
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}