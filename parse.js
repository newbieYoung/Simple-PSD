const PSD = require("psd");
const rimraf = require("rimraf");
const fs = require("fs");
const { time } = require("console");
const { fileURLToPath } = require("url");
const psd = PSD.fromFile("./psd.psd");
psd.parse();
const root = "./images/";
const tree = psd.tree();

// 重置资源
rimraf(root, function () {
  fs.mkdirSync(root);
  main();
});

function main() {
  // 过滤
  let timestamp = Date.now();
  function filter(node) {
    node.name = `${node.name}_${timestamp++}`;
    const children = node.children();
    if (children) {
      children.map((item) => {
        filter(item);
      });
    }
  }
  filter(tree);

  // 导出 json
  const json = tree.export();

  // 导出图片
  tree.descendants().forEach(function (node) {
    node.saveAsPng(`${root}${node.name}.png`).catch(function (err) {
      console.log(node.name);
      console.log(err.stack);
    });
  });

  fs.writeFile("data.js", `const data = ${JSON.stringify(json)}`, function (
    err
  ) {
    if (err) throw err;
    console.log("Saved successfully"); //文件被保存
  });
}
