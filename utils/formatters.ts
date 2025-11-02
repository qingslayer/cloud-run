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
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  const cleanedText = text.replace(/\\n/g, '\n');
  const blocks = cleanedText.split(/\n\s*\n/);

  return blocks.map((block) => {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) return '';

    if (trimmedBlock.startsWith('* ') || trimmedBlock.startsWith('- ')) {
      const listItems = trimmedBlock.split('\n').map((item) => {
        const content = item.trim().substring(item.indexOf(' ') + 1).trim();
        return `<li>${processInlineFormatting(content)}</li>`;
      }).join('');
      return `<ul class="list-disc list-inside">${listItems}</ul>`;
    }
    
    const paragraphContent = processInlineFormatting(trimmedBlock.replace(/\n/g, '<br />'));
    return `<p>${paragraphContent}</p>`;

  }).join('');
};