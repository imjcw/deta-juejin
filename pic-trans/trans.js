import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { copy, readerFromStreamReader } from "https://deno.land/std/streams/mod.ts";
import pptxgen from "npm:pptxgenjs";
import sizeOf from 'npm:image-size';

const baseDir = '/tmp'

async function getLinksFromURL(url) {
    const response = await fetch(url);
    const html = await response.text();

    const doc = new DOMParser().parseFromString(html, "text/html");
    const pics = [];

    const anchorElements = doc.querySelectorAll("a");
    const storyName = doc.querySelector('.infoTit').innerText;
    const saver = [];
    for (const anchorElement of anchorElements) {
        const imageName = anchorElement.innerHTML;
        const href = anchorElement.getAttribute("href");
        if (href && /^第\d+页图片$/.test(imageName)) {
            saver.push(saveImage(href, storyName, imageName))
        }
    }
    const results = await Promise.all(saver)

    for (let index = 0; index < results.length; index++) {
        pics.push(results[index])
    }

    return { pics, storyName };
}

// 保存图片到本地
async function saveImage(url, storyName, imageName) {
    try {
        await Deno.mkdir(`${baseDir}/picTrans/images/${storyName}/`, { recursive: true });
    } catch (e) { console.log(e) }
    const response = await fetch(url);
    const reader = readerFromStreamReader(response.body.getReader());
    const filePath = `${baseDir}/picTrans/images/${storyName}/${imageName}.jpg`;
    const file = await Deno.create(`${baseDir}/picTrans/images/${storyName}/${imageName}.jpg`);
    await copy(reader, file);
    return filePath
}

async function createPPT(fileName, pics) {
    let pptx = new pptxgen();
    const width = 11.69;
    const height = 8.27;
    // 初始化纸张大小
    pptx.defineLayout({
        name: 'A4',
        width: width,
        height: height
    });
    pptx.layout = 'A4';

    for (let index = 0; index < pics.length; index++) {
        const pic = pics[index];
        pptx.addSlide().addImage(genImagesParams(pic, width, height));
    }

    await pptx.writeFile({
        fileName: `${baseDir}/picTrans/images/${fileName}/${fileName}.pptx`,
        compression:true
    });
    return {
        path: `${baseDir}/picTrans/images/${fileName}/${fileName}.pptx`,
        fileName: `${fileName}.pptx`
    }
}

function genImagesParams(picPath, pageWidth, pageHeight) {
    const metadata = sizeOf(picPath)
    var params = {
        path: picPath,
        x: 0,
        y: 0,
        w: 0,
        h: 0
    }
    if (metadata.height/metadata.width > pageHeight/pageWidth) {
        // 只保证高度撑满页面即可，宽度随意
        params.h = pageHeight
        params.w = parseFloat((pageHeight * (metadata.width / metadata.height)))
        params.x = parseFloat(((pageWidth - params.w) / 2))
    } else {
        // 保证宽度，高度居中(可裁剪)
        params.w = pageWidth
        params.h = parseFloat((pageWidth * (metadata.height / metadata.width)))
        params.y = parseFloat(((pageHeight - params.h) / 2))
    }
    return params;
}

export default async function genPPT(url) {
    const storyInfo = await getLinksFromURL(url);
    return createPPT(storyInfo.storyName, storyInfo.pics);
}