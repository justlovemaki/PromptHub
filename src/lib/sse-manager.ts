// SSE 连接管理器
// 存储所有活跃的SSE连接
const connections = new Map<string, { 
  controller: ReadableStreamDefaultController; 
  userId: string; 
  personalSpaceId: string; 
}>();

// 广播消息到指定空间的所有连接
export function broadcastToSpace(spaceId: string, event: {
  type: string;
  data: any;
}) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  
  connections.forEach((connection, connectionId) => {
    if (connection.personalSpaceId === spaceId) {
      try {
        connection.controller.enqueue(message);
      } catch (error) {
        // 连接已关闭，清理
        connections.delete(connectionId);
      }
    }
  });
}

// 广播消息到特定用户
export function broadcastToUser(userId: string, event: {
  type: string;
  data: any;
}) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  
  connections.forEach((connection, connectionId) => {
    if (connection.userId === userId) {
      try {
        connection.controller.enqueue(message);
      } catch (error) {
        // 连接已关闭，清理
        connections.delete(connectionId);
      }
    }
  });
}

// 获取活跃连接数统计
export function getConnectionStats() {
  const stats = {
    totalConnections: connections.size,
    userConnections: new Map<string, number>(),
    spaceConnections: new Map<string, number>(),
  };
  
  Array.from(connections.values()).forEach(connection => {
    // 用户连接统计
    const userCount = stats.userConnections.get(connection.userId) || 0;
    stats.userConnections.set(connection.userId, userCount + 1);
    
    // 空间连接统计
    const spaceCount = stats.spaceConnections.get(connection.personalSpaceId) || 0;
    stats.spaceConnections.set(connection.personalSpaceId, spaceCount + 1);
  });
  
  return stats;
}

// 添加连接
export function addConnection(connectionId: string, connection: { 
  controller: ReadableStreamDefaultController; 
  userId: string; 
  personalSpaceId: string; 
}) {
  connections.set(connectionId, connection);
}

// 删除连接
export function removeConnection(connectionId: string) {
  connections.delete(connectionId);
}