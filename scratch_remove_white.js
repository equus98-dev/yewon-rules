const sharp = require('sharp');

async function removeWhite(inputFile, outputFile) {
    try {
        const { data, info } = await sharp(inputFile)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Iterate through pixels and make white ones transparent
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            // If pixel is near white (e.g., > 240 for R, G, B)
            if (r > 240 && g > 240 && b > 240) {
                data[i+3] = 0; // Set alpha to 0
            }
        }

        await sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: info.channels
            }
        }).toFile(outputFile);
        console.log(`Processed ${inputFile} -> ${outputFile}`);
    } catch (err) {
        console.error(`Error processing ${inputFile}:`, err);
    }
}

async function main() {
    await removeWhite('public/docs/kyo.png', 'public/docs/kyo_t.png');
    await removeWhite('public/docs/h_logo1.png', 'public/docs/h_logo1_t.png');
}

main();
