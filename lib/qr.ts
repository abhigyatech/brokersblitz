const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);
let x = 1;
for (let i = 0; i < 255; i++) {
  GF256_EXP[i] = x;
  GF256_EXP[i + 255] = x;
  GF256_LOG[x] = i;
  x <<= 1;
  if (x & 256) x ^= 0x11d;
}

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsCompute(data: number[], ecCount: number): number[] {
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = new Array(gen.length + 1).fill(0);
    const root = GF256_EXP[i];
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gfMul(gen[j], root);
      next[j + 1] ^= gen[j];
    }
    gen = next;
  }

  const res = new Array(ecCount).fill(0);
  for (const b of data) {
    const factor = b ^ res[0];
    for (let i = 0; i < ecCount - 1; i++) {
      res[i] = res[i + 1] ^ gfMul(factor, gen[i + 1]);
    }
    res[ecCount - 1] = gfMul(factor, gen[ecCount]);
  }
  return res;
}

export function generateWhatsAppQRMatrix(url: string): boolean[][] {
  const size = 33;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFinder(r: number, c: number) {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const row = r + i;
        const col = c + j;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          isFunction[row][col] = true;
          if (i >= 0 && i <= 6 && j >= 0 && j <= 6) {
            if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
              matrix[row][col] = true;
            } else {
              matrix[row][col] = false;
            }
          } else {
            matrix[row][col] = false;
          }
        }
      }
    }
  }

  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  function setAlignment(r: number, c: number) {
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const row = r + i;
        const col = c + j;
        isFunction[row][col] = true;
        if (Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)) {
          matrix[row][col] = true;
        } else {
          matrix[row][col] = false;
        }
      }
    }
  }
  setAlignment(26, 26);

  for (let c = 8; c < size - 8; c++) {
    isFunction[6][c] = true;
    matrix[6][c] = c % 2 === 0;
    isFunction[c][6] = true;
    matrix[c][6] = c % 2 === 0;
  }

  isFunction[size - 8][8] = true;
  matrix[size - 8][8] = true;

  for (let i = 0; i <= 8; i++) {
    isFunction[8][i] = true;
    isFunction[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    isFunction[8][i] = true;
    isFunction[i][8] = true;
  }

  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const mask = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const maskedFormat = formatBits.map((b, idx) => b ^ mask[idx]);

  for (let i = 0; i < 6; i++) matrix[8][i] = maskedFormat[i] === 1;
  matrix[8][7] = maskedFormat[6] === 1;
  matrix[8][8] = maskedFormat[7] === 1;
  matrix[7][8] = maskedFormat[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = maskedFormat[i] === 1;

  for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = maskedFormat[i] === 1;
  for (let i = 8; i < 15; i++) matrix[8][size - 15 + i] = maskedFormat[i] === 1;

  const encoder = new TextEncoder();
  const utf8Bytes = Array.from(encoder.encode(url));
  const bits: number[] = [];

  function addBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  addBits(0b0100, 4);
  addBits(utf8Bytes.length, 8);
  for (const b of utf8Bytes) {
    addBits(b, 8);
  }

  const maxDataBits = 64 * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  addBits(0, termLen);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i + j];
    }
    dataBytes.push(b);
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataBytes.length < 64) {
    dataBytes.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  const b1Data = dataBytes.slice(0, 32);
  const b2Data = dataBytes.slice(32, 64);
  const b1Ec = rsCompute(b1Data, 18);
  const b2Ec = rsCompute(b2Data, 18);

  const finalCodewords: number[] = [];
  for (let i = 0; i < 32; i++) {
    finalCodewords.push(b1Data[i]);
    finalCodewords.push(b2Data[i]);
  }
  for (let i = 0; i < 18; i++) {
    finalCodewords.push(b1Ec[i]);
    finalCodewords.push(b2Ec[i]);
  }

  const dataBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      dataBits.push((cw >> i) & 1);
    }
  }

  let bitIdx = 0;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--;
    const upward = ((size - 1 - rightCol) / 2) % 2 === 0;

    for (let vert = 0; vert < size; vert++) {
      const row = upward ? size - 1 - vert : vert;
      for (let c = rightCol; c >= rightCol - 1; c--) {
        if (!isFunction[row][c]) {
          let bit = 0;
          if (bitIdx < dataBits.length) {
            bit = dataBits[bitIdx++];
          }
          const maskBit = (row + c) % 2 === 0 ? 1 : 0;
          matrix[row][c] = (bit ^ maskBit) === 1;
        }
      }
    }
  }

  return matrix;
}

