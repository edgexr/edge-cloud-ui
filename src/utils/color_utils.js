/**
 * Copyright 2022 MobiledgeX, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import randomColor from 'randomcolor'

/**
* Convert a hex color string to an RGB number array. Supports hex shorthand triplet.
*
* Example: hexToRgb("#0033ff") => [0, 51, 255]
* Example: hexToRgb("#03f") => [0, 51, 255]
* @returns {number[]} representing [r,g,b] channels
*/
const hexToRgb = hex =>
    hex
        .replace(
            /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
            (m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
        )
        .substring(1)
        .match(/.{2}/g)
        .map(x => parseInt(x, 16));

export const hexToRgbObject = hex => {
    const [r, g, b] = hexToRgb(hex);
    return { r, g, b };
};


const rgb2lab = (rgb) => {
    let r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, x, y, z;
    r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
    y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
    z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;
    return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

export const deltaE = (rgbA, rgbB) => {
    let labA = rgb2lab(rgbA);
    let labB = rgb2lab(rgbB);
    let deltaL = labA[0] - labB[0];
    let deltaA = labA[1] - labB[1];
    let deltaB = labA[2] - labB[2];
    let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
    let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
    let deltaC = c1 - c2;
    let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
    deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
    let sc = 1.0 + 0.045 * c1;
    let sh = 1.0 + 0.015 * c1;
    let deltaLKlsl = deltaL / (1.0);
    let deltaCkcsc = deltaC / (sc);
    let deltaHkhsh = deltaH / (sh);
    let i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
    return i < 0 ? 0 : Math.sqrt(i);
}

export const darkColor = () => {
    return randomColor({ count: 1, luminosity: 'dark' })[0]
}

export const darkColors = (count) => {
    return randomColor({
        count,
        hue: 'random'
    })
}

export const fetchColorWithElimination = (length, eliminationList) => {
    let colors = darkColors(length + 100)
    colors = colors.filter(color => {
        let different = true
        for (const item of eliminationList) {
            if (deltaE(hexToRgb(color), hexToRgb(item)) < 20) {
                different = false
                break;
            }
        }
        return different
    })
    if (colors.length < length) {
        colors = fetchColor(length)
    }
    return colors
}