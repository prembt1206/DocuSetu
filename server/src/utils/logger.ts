export const logger = {
  info: (msg: string, ...args: any[]) => {
    console.log(`\x1b[36m[DocuSetu INFO ${new Date().toISOString()}]\x1b[0m ${msg}`, ...args);
  },
  warn: (msg: string, ...args: any[]) => {
    console.warn(`\x1b[33m[DocuSetu WARN ${new Date().toISOString()}]\x1b[0m ${msg}`, ...args);
  },
  error: (msg: string, ...args: any[]) => {
    console.error(`\x1b[31m[DocuSetu ERROR ${new Date().toISOString()}]\x1b[0m ${msg}`, ...args);
  },
  ai: (msg: string, ...args: any[]) => {
    console.log(`\x1b[35m[DocuSetu AI-PIPELINE ${new Date().toISOString()}]\x1b[0m ${msg}`, ...args);
  }
};
