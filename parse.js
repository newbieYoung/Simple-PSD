const PSD = require("psd");
const fs = require("fs");

const psd = PSD.fromFile("./psd.psd");
psd.parse();
const tree = psd.tree();
const json = tree.export();

// 保存图片
// function saveImage(children, pNames) {
//   let names = pNames.slice();
//   children.map(function (node, index) {
//     let paths = names.concat(`${node.name}`);
//     if (node.image) {
//       let image = paths.reduce((img, cur) => {
//         return `${img}.${cur}`;
//       }, "");
//       let url = `${image}_${index}.png`;
//       // 文件名首位不能为 .
//       if (url[0] === ".") {
//         url = url.substring(1, url.length);
//       }
//       node.image.url = url;

//       console.log(node.depth());
//       node.layer.image.saveAsPng(node.image.url);
//     }
//     if (node.children) {
//       saveImage(node.children, paths);
//     }
//   });
// }

// function main(node) {
//   node.children.map((item, index) => {});
// }

fs.writeFile("data.js", `const data = ${JSON.stringify(json)}`, function (err) {
  if (err) throw err;
  console.log("Saved successfully"); //文件被保存
});
