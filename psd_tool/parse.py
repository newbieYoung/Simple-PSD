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
tree['name'] = psd.name
tree['top'] = psd.top
tree['left'] = psd.left
tree['opacity'] = 255
tree['children'] = []

def objToJson(obj):
  return str(obj).replace("u'","'").replace("'",'"').replace('False','false').replace('True','true')

def string(val):
  return str(val).replace("u'","'").replace("'",'')

def colortoRGBA(color):
  return 'rgba('+str(int(color[1]*255))+','+str(int(color[2]*255))+','+str(int(color[3]*255))+','+str(int(color[0]*255))+')'

# 解析文本图层
def parseText(layer, obj):
  obj['texts'] = []
  text = layer.engine_dict['Editor']['Text'].value
  fontset = layer.resource_dict['FontSet']
  runlength = layer.engine_dict['StyleRun']['RunLengthArray']
  rundata = layer.engine_dict['StyleRun']['RunArray']
  index = 0
  maxLeading = 0

  for length, style in zip(runlength, rundata): # 文本分段
      item = {}
      substring = text[index:index + length]
      stylesheet = style['StyleSheet']['StyleSheetData']
      fillColor = stylesheet['FillColor']
      font = fontset[stylesheet['Font']]
      index += length
      
      leading = stylesheet.get("Leading", obj['height']) # PS 设置 Leading auto 时，解析结果中并不存在该字段
      if(maxLeading<leading):
        maxLeading = leading

      item['text'] = substring
      item['fontSize'] = string(stylesheet['FontSize'])
      item['color'] = colortoRGBA(fillColor['Values'])
      item['lineHeight'] = string(leading)
      item['font'] = string(font['Name'])
      obj['texts'].append(item)
  
  height = obj['height']
  if(height != maxLeading):
    obj['height'] = string(maxLeading)
    obj['top'] = obj['top'] - (maxLeading - height)/2

# 遍历图层
def parse(layer, obj):
  if(layer.is_visible()): # 仅处理可见图层
    layer_name = str(layer.name)
    print('-------')
    print(layer_name)
    print(layer.layer_id)

    obj['id'] = layer.layer_id
    obj['name'] = layer_name
    obj['width'] = layer.width
    obj['height'] = layer.height
    obj['top'] = layer.top
    obj['left'] = layer.left
    obj['opacity'] = layer.opacity
    obj['children'] = []
    
    if(layer.is_group()):
      for child in layer:
        item = {}
        obj['children'].append(item)
        parse(child, item)
    else:
      #if(layer.kind == 'type' and layer.text): # TypeLayer text
      #  parseText(layer, obj)
      #else:  
        obj['image'] = str(layer.layer_id)+'.png'
        try: # 优先使用复合图片
          layer.composite().save('/Users/bytedance/Projects/Simple-PSD/psd_tool/images/'+obj['image'])
        except: # 某些情况下会报错，降级使用非复合图片
          layer.topil().save('/Users/bytedance/Projects/Simple-PSD/psd_tool/images/'+obj['image'])

#循环遍历
for layer in psd:
    obj = {}
    tree['children'].append(obj)
    parse(layer, obj)

# 写入文件
fo = open('./data.js', "wb")
fo.write('const data = '+json.dumps(tree))