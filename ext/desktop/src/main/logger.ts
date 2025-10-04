import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import * as os from 'os';

// 获取日志文件路径
function getLogPath(): string {
  try {
    // 如果 app 已经 ready，使用正常路径
    if (app.isReady()) {
      const userDataPath = app.getPath('userData');
      return path.join(userDataPath, 'app.log');
    }
    // 否则使用临时目录
    const tempPath = os.tmpdir();
    return path.join(tempPath, 'prompthub-desktop-startup.log');
  } catch (error) {
    // 如果完全失败，使用临时目录
    const tempPath = os.tmpdir();
    return path.join(tempPath, 'prompthub-desktop-startup.log');
  }
}

// 写入日志
export function writeLog(message: string, level: 'INFO' | 'ERROR' | 'WARN' = 'INFO'): void {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    const logPath = getLogPath();
    fs.appendFileSync(logPath, logMessage, 'utf-8');
    
    // 同时输出到控制台
    console.log(logMessage.trim());
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

// 清空日志文件
export function clearLog(): void {
  try {
    const logPath = getLogPath();
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }
  } catch (error) {
    console.error('Failed to clear log:', error);
  }
}

// 读取日志内容
export function readLog(): string {
  try {
    const logPath = getLogPath();
    if (fs.existsSync(logPath)) {
      return fs.readFileSync(logPath, 'utf-8');
    }
    return '';
  } catch (error) {
    console.error('Failed to read log:', error);
    return '';
  }
}

// 获取日志文件路径（供外部访问）
export function getLogFilePath(): string {
  return getLogPath();
}