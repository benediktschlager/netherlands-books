import fs from 'fs/promises';
import sharp from 'sharp';

const IMAGE_PATH = 'public/images/';

export function getImagePath(fileName: string) {
    return IMAGE_PATH + fileName;
}


export async function createImagePreviews(fileName: string) {
    const fileEnding = "." +  fileName.split('.').pop();
    const rSmall = fileName.replace(fileEnding, "_120.webp");
    const rMedium = fileName.replace(fileEnding, "_400.webp");
    const small = getImagePath(rSmall);
    const medium = getImagePath(rMedium);

    const f = await fs.readFile(getImagePath(fileName));
    const image = sharp(f);
    const metadata = await image.metadata();
    if (metadata.width && metadata.height) {
        let width = Math.min(metadata.width, 400);
       image.resize(width, null).toFile(medium);
         width = Math.min(metadata.width, 120);
       image.resize(width, null).toFile(small);
    }

    return { small: rSmall, medium: rMedium };
}
