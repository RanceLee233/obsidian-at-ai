import { Editor, EditorPosition } from 'obsidian';

export interface TriggerMatch {
  keyword: string;
  position: EditorPosition;
  line: string;
}

export class TriggerManager {
  private keywords: string[] = [];
  private onTriggerCallback?: (match: TriggerMatch, editor: Editor) => void;

  constructor(keywords: string[] = []) {
    this.keywords = keywords;
  }

  /**
   * 设置触发关键词
   */
  setKeywords(keywords: string[]): void {
    this.keywords = keywords.filter(k => k.trim().length > 0);
  }

  /**
   * 获取当前关键词
   */
  getKeywords(): string[] {
    return [...this.keywords];
  }

  /**
   * 添加关键词
   */
  addKeyword(keyword: string): void {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword && !this.keywords.includes(trimmedKeyword)) {
      this.keywords.push(trimmedKeyword);
    }
  }

  /**
   * 删除关键词
   */
  removeKeyword(keyword: string): void {
    const index = this.keywords.indexOf(keyword);
    if (index !== -1) {
      this.keywords.splice(index, 1);
    }
  }

  /**
   * 设置触发回调
   */
  setTriggerCallback(callback: (match: TriggerMatch, editor: Editor) => void): void {
    this.onTriggerCallback = callback;
  }

  /**
   * 检查是否匹配触发条件
   * 关键词 + 空格的组合
   */
  checkTrigger(editor: Editor): TriggerMatch | null {
    if (this.keywords.length === 0) {
      return null;
    }

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    
    // 获取光标前的文本
    const textBeforeCursor = line.substring(0, cursor.ch);
    
    // 检查是否以空格结尾（触发条件）
    if (!textBeforeCursor.endsWith(' ')) {
      return null;
    }

    // 移除末尾空格，检查是否匹配任何关键词
    const textWithoutSpace = textBeforeCursor.slice(0, -1);
    
    for (const keyword of this.keywords) {
      if (this.matchesKeyword(textWithoutSpace, keyword)) {
        return {
          keyword,
          position: cursor,
          line: line
        };
      }
    }

    return null;
  }

  /**
   * 检查文本是否匹配关键词
   * 支持关键词在行首或前面有空格
   */
  private matchesKeyword(text: string, keyword: string): boolean {
    // 情况1: 关键词在行首
    if (text === keyword) {
      return true;
    }

    // 情况2: 关键词前有空格或其他分隔符
    if (text.endsWith(keyword)) {
      const beforeKeyword = text.substring(0, text.length - keyword.length);
      // 检查关键词前是否为空格或行首
      return beforeKeyword.length === 0 || /\s$/.test(beforeKeyword);
    }

    return false;
  }

  /**
   * 处理编辑器输入事件
   */
  handleEditorChange(editor: Editor): void {
    if (!this.onTriggerCallback) {
      return;
    }

    const match = this.checkTrigger(editor);
    if (match) {
      // 找到匹配，触发回调
      this.onTriggerCallback(match, editor);
    }
  }

  /**
   * 清理触发词（从编辑器中删除已输入的关键词）
   */
  cleanupTrigger(editor: Editor, match: TriggerMatch): void {
    try {
      const cursor = match.position;
      const keyword = match.keyword;
      
      // 计算关键词的起始位置
      const line = editor.getLine(cursor.line);
      const textBeforeCursor = line.substring(0, cursor.ch);
      
      // 找到关键词在行中的位置
      let keywordStart = textBeforeCursor.lastIndexOf(keyword);
      
      if (keywordStart !== -1) {
        // 检查关键词前是否有空格，如果有也一起删除
        while (keywordStart > 0 && /\s/.test(line.charAt(keywordStart - 1))) {
          keywordStart--;
        }
        
        // 删除关键词和后面的空格
        const from = { line: cursor.line, ch: keywordStart };
        const to = { line: cursor.line, ch: cursor.ch };
        
        editor.replaceRange('', from, to);
      }
    } catch (error) {
      console.error('Failed to cleanup trigger:', error);
    }
  }

  /**
   * 验证关键词格式
   */
  validateKeyword(keyword: string): { valid: boolean; error?: string } {
    const trimmed = keyword.trim();
    
    if (trimmed.length === 0) {
      return { valid: false, error: 'Keyword cannot be empty' };
    }

    if (trimmed.includes(' ')) {
      return { valid: false, error: 'Keyword cannot contain spaces' };
    }

    if (trimmed.length > 20) {
      return { valid: false, error: 'Keyword too long (max 20 characters)' };
    }

    // 检查是否包含特殊字符（保留一些常用符号）
    const allowedPattern = /^[@#$%&*+\-_.a-zA-Z0-9\u4e00-\u9fa5]+$/;
    if (!allowedPattern.test(trimmed)) {
      return { valid: false, error: 'Keyword contains invalid characters' };
    }

    return { valid: true };
  }

  /**
   * 解析关键词字符串（支持分号分隔）
   */
  parseKeywords(keywordString: string): string[] {
    return keywordString
      .split(/[;,]/)
      .map(k => k.trim())
      .filter(k => k.length > 0 && this.validateKeyword(k).valid);
  }

  /**
   * 将关键词数组转为字符串
   */
  stringifyKeywords(keywords: string[]): string {
    return keywords.join(';');
  }
}