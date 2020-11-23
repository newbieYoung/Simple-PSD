const PSD = require("psd");
const rimraf = require("rimraf");
const fs = require("fs");
const http = require("http");
const root = "./images/";

// 转 rgba
function colorToRGBA(color) {
  return (
    "rgba(" +
    parseInt(color[1] * 255) +
    "," +
    parseInt(color[2] * 255) +
    "," +
    parseInt(color[3] * 255) +
    "," +
    parseInt(color[0] * 255) +
    ")"
  );
}

// 解析文本图层
function parseText(node, obj) {
  let typeTool = node.layer.typeTool();
  let styles = typeTool.styles();
  obj.text = {
    value: typeTool.textValue,
    font: typeTool.fonts().join(),
    lineHeight: styles.Leading[0],
    fontSize: styles.FontSize[0],
    color: colorToRGBA(styles.FillColor[0].Values),
  };
}

// 过滤
function parse(node) {
  let layer = node.layer;
  let json = {};
  json.width = node.width;
  json.height = node.height;
  json.top = node.top;
  json.left = node.left;
  json.id = newId();
  json.opacity = layer.opacity == null ? 255 : layer.opacity;
  json.children = [];

  if (node.isGroup()) {
    // 组
  } else {
    if (layer.typeTool) {
      parseText(node, json);
    } else if (layer.image) {
      saveImage(node, json);
    }
  }

  let children = node._children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      let item = children[i];
      if (item.layer.visible) {
        json.children.push(parse(item));
      }
    }
  }

  return json;
}

// ---

// 保存图片
function saveImage(node, obj) {
  obj.image = obj.id + ".png";
  node.saveAsPng(`${root}${obj.id}.png`).catch(function (err) {
    console.log(node.name);
    console.log(err.stack);
  });
}

// uuid
var timestamp = Date.now();
function newId() {
  return timestamp++;
}

// remotefile
http.get("http://127.0.0.1:5500/psdjs/psd.psd", (res) => {
  res.setEncoding("binary");
  let chunks = [];
  res.on("data", (chunk) => {
    chunks.push(Buffer.from(chunk, "binary"));
  });
  res.on("end", () => {
    let binary = Buffer.concat(chunks);
    main(new PSD(binary));
  });
});

// localfile
// const psd = PSD.fromFile("./psd.psd");

function main(psd) {
  // 重置资源;
  rimraf(root, function () {
    fs.mkdirSync(root);

    psd.parse();
    const tree = psd.tree();
    const json = parse(tree);

    fs.writeFile(
      "data.js",
      `const data = ${JSON.stringify(json)}`,
      function (err) {
        if (err) throw err;
        console.log("Saved successfully"); //文件被保存
      }
    );
  });
}
