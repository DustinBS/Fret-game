const fs = require('fs');
const tuning = [64, 59, 55, 50, 45, 40]; // 0=E4 to 5=E2
const intervalsFlat = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

function getInterval(quality, rootString, rootOffset, string, offset) {
    const rootPitch = tuning[rootString] + rootOffset;
    const notesPitch = tuning[string] + offset;
    let semitones = (notesPitch - rootPitch) % 12;
    if (semitones < 0) semitones += 12;

    let interval = intervalsFlat[semitones];
    
    // adjust enharmonics based on quality
    if (semitones === 11 && quality.includes('dim7')) interval = 'bb7';
    if (semitones === 6 && quality.includes('dim')) interval = 'b5';
    if (semitones === 6 && quality.includes('#11')) interval = '#11';
    if (semitones === 8 && quality.includes('aug')) interval = '#5';
    if (semitones === 4 && quality.includes('min')) interval = '3'; // wait, minor should have b3, major has 3
    if (semitones === 2 && quality.includes('9')) interval = '9';
    if (semitones === 4 && quality.includes('11')) interval = '3'; // don't mess up 3rd
    if (semitones === 5 && quality.includes('11')) interval = '11';
    if (semitones === 9 && quality.includes('13')) interval = '13';
    
    return interval;
}

let code = fs.readFileSync('src/utils/chordLibrary.ts', 'utf8');

const regex = /{ rootString: (\d+), offsets: \[([^\]]+)\] }/g;

code = code.replace(regex, (match, rootString, offsetsStr, offset, fullMatch) => {
    const beforePart = code.substring(0, offset);
    const qualityMatch = beforePart.match(/quality:\s*"([^"]+)"/g);
    const quality = qualityMatch ? qualityMatch[qualityMatch.length - 1].replace(/quality:\s*"/, '').replace('"', '') : '';

    const newOffsets = offsetsStr.replace(/{ string: (\d+), offset: (-?\d+) }/g, (m2, strIdx, strOff) => {
        const interval = getInterval(quality, parseInt(rootString), 0, parseInt(strIdx), parseInt(strOff));
        return `{ string: ${strIdx}, offset: ${strOff}, interval: '${interval}' }`;
    });
    return `{ rootString: ${rootString}, offsets: [${newOffsets}] }`;
});

// also fix the type definition
code = code.replace(`offsets: { string: number; offset: number }[]`, `offsets: { string: number; offset: number; interval: string }[]`);

fs.writeFileSync('src/utils/chordLibrary.ts', code);
console.log('Done!');
