import React from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
  user?: {
    name?: string | null;
    email?: string;
    subscriptionStatus?: 'FREE' | 'PRO' | 'TEAM';
  } | null;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, className = '', user }) => {
  // 根据订阅状态设置颜色
  const getSubscriptionColorClasses = () => {
    if (!user || !user.subscriptionStatus) return 'from-gray-500 to-gray-700'; // 默认颜色
    
    switch (user.subscriptionStatus) {
      case 'PRO':
        return 'from-cyan-500 to-blue-600'; // 更具科技感的蓝绿色渐变
      case 'TEAM':
        return 'from-purple-500 via-purple-600 to-indigo-700'; // 渐变紫色
      case 'FREE':
      default:
        return 'from-gray-500 to-gray-700'; // 免费用户颜色
    }
  };

  const bgColorClasses = getSubscriptionColorClasses();
  
  return (
    <div className={`relative group ${className}`}>
      <div className={`w-9 h-9 bg-gradient-to-r rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200 ${bgColorClasses}`}>
        <span className="text-white font-medium text-sm">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </span>
      </div>
      {children}
    </div>
  );
};

export default DropdownMenu;