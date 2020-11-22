const PSD = require("psd");
const rimraf = require("rimraf");
const fs = require("fs");
const http = require("http");
const root = "./images/";

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
  psd.parse();
  const tree = psd.tree();

  // 重置资源;
  rimraf(root, function () {
    fs.mkdirSync(root);

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
      if (node.isGroup()) return;
      node.saveAsPng(`${root}${node.name}.png`).catch(function (err) {
        console.log(node.name);
        console.log(err.stack);
      });
    });

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
