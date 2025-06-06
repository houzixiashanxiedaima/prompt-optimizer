import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMService, ModelManager, RequestConfigError, APIError } from '../src';
import { createMockStorage } from './mocks/mockStorage';

describe('LLMService', () => {
  let llmService;
  let modelManager;
  const testProvider = 'test-provider';
  const mockModelConfig = {
    name: 'Test Model',
    provider: 'openai',
    apiKey: 'test-key',
    baseURL: 'https://api.test.com',
    defaultModel: 'test-model',
    enabled: true,
    models: ['test-model']
  };

  beforeEach(() => {
    const mockStorage = createMockStorage();
    // 模拟getAllModels返回空数组
    mockStorage.getItem.mockResolvedValue(null);
    
    modelManager = new ModelManager(mockStorage);
    llmService = new LLMService(modelManager);
    
    // 模拟getAllModels方法
    vi.spyOn(modelManager, 'getAllModels').mockResolvedValue([]);
  });

  describe('消息验证', () => {
    it('应该正确验证消息格式', () => {
      const validMessages = [
        { role: 'system', content: 'test' },
        { role: 'user', content: 'test' }
      ];
      expect(() => llmService['validateMessages'](validMessages)).not.toThrow();
    });

    it('当消息格式无效时应抛出错误', () => {
      const invalidMessages = [
        { role: 'invalid', content: 'test' }
      ];
      expect(() => llmService['validateMessages'](invalidMessages))
        .toThrow('不支持的消息类型: invalid');
    });
  });

  describe('模型配置验证', () => {
    it('应该正确验证模型配置', () => {
      expect(() => llmService['validateModelConfig'](mockModelConfig)).not.toThrow();
    });

    it('当模型配置无效时应抛出错误', () => {
      const invalidConfig = { ...mockModelConfig, apiKey: '' };
      expect(() => llmService['validateModelConfig'](invalidConfig))
        .toThrow('API密钥不能为空');
    });

    it('当模型未启用时应抛出错误', () => {
      const disabledConfig = { ...mockModelConfig, enabled: false };
      expect(() => llmService['validateModelConfig'](disabledConfig))
        .toThrow('模型未启用');
    });
  });

  describe('发送消息', () => {
    it('当提供商不存在时应抛出错误', async () => {
      vi.spyOn(modelManager, 'getModel').mockResolvedValue(undefined);
      
      const messages = [
        { role: 'system', content: 'test' }
      ];
      await expect(llmService.sendMessage(messages, 'non-existent-provider'))
        .rejects
        .toThrow(RequestConfigError);
    });

    it('当消息格式无效时应抛出错误', async () => {
      vi.spyOn(modelManager, 'getModel').mockResolvedValue(mockModelConfig);
      
      const invalidMessages = [
        { role: 'invalid', content: 'test' }
      ];
      await expect(llmService.sendMessage(invalidMessages, testProvider))
        .rejects
        .toThrow(RequestConfigError);
    });
  });
});
