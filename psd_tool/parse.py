# coding:utf-8
import sys  
reload(sys)  
sys.setdefaultencoding('utf8')

from psd_tools import PSDImage
from psd_tools.constants import BlendMode
import os
import shutil
import json

# 清空素材目录
resource_dir = './images'
shutil.rmtree(resource_dir) 
os.mkdir(resource_dir)

# 解析 psd
psd = PSDImage.open('/Users/bytedance/Projects/Simple-PSD/psd_tool/psd.psd')
tree = {}
tree['width'] = psd.width
tree['height'] = psd.height
tree['children'] = []

def parse(layer, obj):
  if(layer.is_visible()): # 仅处理可见图层
    layer_name = str(layer.name)
    print('-------')
    print(layer_name)
    print(layer.layer_id)
    print(layer.has_effects())
    print(layer.effects)

    obj['layer_id'] = layer.layer_id
    obj['width'] = layer.width
    obj['height'] = layer.height
    obj['top'] = layer.top
    obj['left'] = layer.left
    obj['is_visible'] = layer.is_visible()
    obj['children'] = []
    
    if(layer.is_group()):
      for child in layer:
        item = {}
        obj['children'].append(item)
        parse(child, item)
    else:
      obj['image'] = {}
      try: # 优先使用复合图片
        layer.composite().save('/Users/bytedance/Projects/Simple-PSD/psd_tool/images/'+str(layer.layer_id)+'.png')
      except: # 某些情况下会报错，降级使用非复合图片
        layer.topil().save('/Users/bytedance/Projects/Simple-PSD/psd_tool/images/'+str(layer.layer_id)+'.png')

#循环遍历
for layer in psd:
    obj = {}
    tree['children'].append(obj)
    parse(layer, obj)

# 写入文件
fo = open('./data.js', "wb")
fo.write('const data = '+json.dumps(tree))