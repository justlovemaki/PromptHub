#!/usr/bin/env python3
"""
用于解析提示词ID列表并循环调用Google MakerSuite API的脚本
"""
import json
import requests
import time
import logging
from typing import List, Dict, Any, Optional

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DriveResourceResolver:
    def __init__(self, auth_headers: Optional[Dict[str, str]] = None, cookies: Optional[Dict[str, str]] = None):
        """
        初始化驱动资源解析器
        
        Args:
            auth_headers: 认证请求头
            cookies: 认证Cookie
        """
        self.base_url = "https://alkalimakersuite-pa.clients6.google.com/$rpc/google.internal.alkali.applications.makersuite.v1.MakerSuiteService/ResolveDriveResource"
        self.session = requests.Session()
        
        # 默认请求头
        default_headers = {
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7',
            'content-type': 'application/json+protobuf',
            'origin': 'https://aistudio.google.com',
            'priority': 'u=1, i',
            'referer': 'https://aistudio.google.com/',
            'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
            'sec-ch-ua-arch': '"x86"',
            'sec-ch-ua-bitness': '"64"',
            'sec-ch-ua-form-factors': '"Desktop"',
            'sec-ch-ua-full-version': '"140.0.7339.186"',
            'sec-ch-ua-full-version-list': '"Chromium";v="140.0.7339.186", "Not=A?Brand";v="24.0.0.0", "Google Chrome";v="140.0.7339.186"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-model': '""',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua-platform-version': '"19.0.0"',
            'sec-ch-ua-wow64': '?0',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'x-browser-channel': 'stable',
            'x-browser-copyright': 'Copyright 2025 Google LLC. All rights reserved.',
            'x-browser-validation': 'DTaAFOAcbbd2xIkIWiLdbtAAhQc=',
            'x-browser-year': '2025',
            'x-client-data': 'CIe2yQEIpLbJAQipncoBCIH3ygEIlaHLAQiFoM0BCP2lzgEIuf3OAQiFhc8BCL2IzwEI04jPAQjsiM8BCIWKzwEIh4rPAQipi88BCMuLzwEIpIzPAQiOjs8BGJiIzwEYxYvPAQ==',
            'x-goog-api-key': 'AIzaSyDdP816MREB3SkjZO04QXbjsigfcI0GWOs',
            'x-goog-authuser': '0',
            'x-goog-ext-519733851-bin': 'CAASAUIwATgEQAA=',
            'x-user-agent': 'grpc-web-javascript/0.1'
        }
        
        if auth_headers:
            default_headers.update(auth_headers)
        
        self.session.headers.update(default_headers)
        
        if cookies:
            self.session.cookies.update(cookies)
    
    def resolve_resource(self, resource_id: str) -> Optional[Dict[Any, Any]]:
        """
        解析单个驱动资源
        
        Args:
            resource_id: 资源ID
            
        Returns:
            API响应数据或None
        """
        try:
            payload = [resource_id]
            logger.info(f"正在请求资源: {resource_id}")
            
            response = self.session.post(
                self.base_url,
                data=json.dumps(payload),
                timeout=60
            )
            
            if response.status_code == 200:
                logger.info(f"成功获取资源 {resource_id} 的数据")
                return response.json()
            else:
                logger.error(f"请求资源 {resource_id} 失败，状态码: {response.status_code}, 响应: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"请求资源 {resource_id} 时发生错误: {str(e)}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"解析资源 {resource_id} 的响应时发生错误: {str(e)}")
            return None
    
    def resolve_resources(self, resource_ids: List[str], delay: float = 1.0) -> List[Dict[str, Any]]:
        """
        批量解析驱动资源
        
        Args:
            resource_ids: 资源ID列表
            delay: 请求间隔时间（秒）
            
        Returns:
            包含响应数据的列表
        """
        results = []
        
        for i, resource_id in enumerate(resource_ids):
            logger.info(f"处理进度: {i+1}/{len(resource_ids)}")
            
            result = self.resolve_resource(resource_id)
            if result:
                results.append({
                    'resource_id': resource_id,
                    'data': result
                })
            else:
                results.append({
                    'resource_id': resource_id,
                    'error': 'Failed to resolve resource'
                })
            
            # 请求间隔，避免过于频繁的请求
            if i < len(resource_ids) - 1:
                time.sleep(delay)
        
        return results

def extract_prompt_data(api_response, resource_id):
    """
    从API响应中提取提示词数据并转换为指定格式
    根据用户提供的示例数据格式，提取标题和内容
    """
    try:
        # 根据用户提供的API响应格式，提取标题和内容
        # 需要从data下第一个数组的第五条数据的第一条数据获取title
        # 从倒数第二条数据中的第一条数据获取content
        if isinstance(api_response, list) and len(api_response) > 0:
            # 从您提供的API响应示例来看，结构是：
            # [
            #   [resource_id, null, null, [...], [title, ...], ..., [content, ...], [...]
            # ]
            
            # 尝试从第五个元素（索引为4）的第一个元素获取标题
            if len(api_response) > 4:
                title_list = api_response[4] if len(api_response) > 4 else None
                if title_list and isinstance(title_list, list) and len(title_list) > 0:
                    title = title_list[0] if title_list[0] is not None else f"未找到标题_{resource_id}"
                else:
                    title = f"未找到标题_{resource_id}"
            else:
                title = f"未找到标题_{resource_id}"
            
            # 获取倒数第二个元素，其第一个元素是内容
            if len(api_response) > 1:
                content_list = api_response[-2] if isinstance(api_response[-2], list) else None
                if content_list and len(content_list) > 0:
                    content = content_list[0] if content_list[0] is not None else "未找到内容"
                else:
                    content = "未找到内容"
            else:
                content = "未找到内容"
                
            return {
                "content": content,
                "isPublic": False,
                # "tags": ["general"],
                "title": title[:100]  # 限制标题长度
            }
        
        # 如果无法解析数据，返回默认格式
        return {
            "content": "无法解析的内容",
            "isPublic": False,
            # "tags": ["general"],
            "title": f"无法解析的标题_{resource_id}"
        }
    except Exception as e:
        logger.error(f"解析API响应时出错: {str(e)}")
        return {
            "content": "解析错误",
            "isPublic": False,
            # "tags": ["general"],
            "title": f"解析错误_{resource_id}"
        }

def process_api_responses_to_file(api_responses, output_file='prompts_output.json'):
    """
    处理API响应列表并将其转换为指定格式后保存到文件
    """
    results = []
    
    for response_obj in api_responses:
        if 'data' in response_obj and isinstance(response_obj['data'], list):
            logger.info(f"正在处理资源: {response_obj.get('resource_id', 'unknown')}")
            resource_id = response_obj.get('resource_id', 'unknown')
            prompt_data = extract_prompt_data(response_obj['data'][0], resource_id)
            results.append(prompt_data)
        elif 'error' in response_obj:
            # 处理错误情况
            resource_id = response_obj.get('resource_id', 'unknown')
            results.append({
                "content": "请求失败",
                "isPublic": False,
                "tags": ["error"],
                "title": f"请求失败_{resource_id}"
            })
        else:
            logger.warning(f"无法处理响应数据: {response_obj}")
    
    # 保存结果到文件
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    logger.info(f"已将 {len(results)} 条提示词数据保存到 {output_file}")
    return results

def main():
    # 提供的资源ID列表
    resource_ids = [
        "1xHlIJymh8TYrIHTHtI1PugoZKvf3S-D5",
        "1ZgtbhoP0j5mpRMiEcdK23mTIqYUgZzV9",
        "1jc-ZTjfKx3-GggMNI9iSY7qPXRwxjhxp",
        "1IeskACHGn1Fu_n6hdgoGHbFY5_-q9NET",
        "1UvHNOkAgJIfP3NCJ23hxZlYpXHKGQp3t",
        "1_-2hefPcDgcba82HC5YeP6VYR5nM0sB2",
    ]
    
    # 从环境变量或配置文件中获取认证信息（这里使用占位符）
    # 实际使用时，您需要替换为真实的认证信息
    auth_headers = {
        'authorization': 'xxx'
    }
    
    cookies = {
        
    }
    
    # 创建解析器实例
    resolver = DriveResourceResolver(auth_headers=auth_headers, cookies=cookies)
    
    # 执行批量解析
    logger.info(f"开始处理 {len(resource_ids)} 个资源")
    results = resolver.resolve_resources(resource_ids, delay=3.0)
    
    # 输出结果统计
    successful = sum(1 for r in results if 'error' not in r)
    failed = len(results) - successful
    
    logger.info(f"处理完成！成功: {successful}, 失败: {failed}")
    
    # 保存原始结果到文件
    with open('resolve_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    logger.info("原始结果已保存到 resolve_results.json")
    
    # 处理API响应并将数据转换为指定格式保存
    processed_results = process_api_responses_to_file(results, 'prompts_output.json')
    
    logger.info("处理完成！")
    
    return results

if __name__ == "__main__":
    main()