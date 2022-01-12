const { randomBytes, createHash } = require('crypto')

//法素数
const P = 2n ** 256n - 2n ** 32n - 2n ** 9n - 2n ** 8n - 2n ** 7n - 2n ** 6n - 2n ** 4n - 1n

//開始座標
const GX = BigInt("0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798")
const GY = BigInt("0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8")

// BigInt -> Buffer
const toBuffer = n => {
  const hex = (n < 0n ? n + P : n).toString(16)
  const buffer = Buffer.from(hex.length % 2 ? '0' + hex : hex, "hex")
  return buffer.length < 32 ? Buffer.concat([Buffer.alloc(32 - buffer.length, 0), buffer]) : buffer
}

//冪剰余
const expmod = (b, e) => {
  if (e == 0n) return 1n
  t = expmod(b, e / 2n) ** 2n % P
  if (e % 2n > 0n) t *= b % P
  return t
}

//乗算
const mul = (p) => {
  const [x, y] = p
  if (y == 0n) return [0n, 0n]
  const nu = 3n * expmod(x, 2n) * expmod(2n * y, P - 2n)
  const x2 = expmod(nu, 2n) - 2n * x
  const y2 = nu * (x - x2) - y
  return [x2 % P, y2 % P]
}

//加算
const add = (p, q) => {
  const [x1, y1] = p
  if (x1 == 0n && y1 == 0n) return q
  const [x2, y2] = q
  if (x2 == 0n && y2 == 0n) return p
  if (x1 == x2) return (y1 + y2) % P == 0n ? [0n, 0n] : mul(p)
  const lm = (y1 - y2) * expmod(x1 - x2, P - 2n)
  const x3 = expmod(lm, 2n) - x1 - x2
  const y3 = lm * (x1 - x3) - y1
  return [x3 % P, y3 % P]
}

//楕円曲線暗号(y^2=x^3+7)
const secp256k1 = (p, e) => {
  if (e == 0n) return [0n, 0n]
  let q = secp256k1(p, e / 2n)
  q = add(q, q)
  if (e % 2n > 0n) q = add(q, p)
  return q
}

//秘密鍵から公開鍵を得る
const toPublic = (privateKey, uncompressed = false) => {
  const [x, y] = secp256k1([GX, GY], BigInt("0x" + privateKey.toString("hex")))
  return Buffer.concat(uncompressed ? [Buffer.alloc(1, 4), toBuffer(x), toBuffer(y)] : [Buffer.alloc(1, y % 2n > 0n ? 3 : 2), toBuffer(x)])
}

//base58文字
const LETTERS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
const LETTERS_LENGTH = BigInt(LETTERS.length)
const encode = bytes => {
  let n = BigInt("0x" + bytes.toString("hex"))
  const results = []
  while (n > 0n) {
    r = n % LETTERS_LENGTH
    results.unshift(LETTERS[r])
    n /= LETTERS_LENGTH
  }
  for (const i of bytes) {
    if (i != 0) break
    results.unshift(LETTERS[0])
  }
  return results.join('')
}

//秘密鍵生成
const privateKeyCreate = () => {
  while (true) {
    const bytes = randomBytes(32)
    const n = BigInt("0x" + bytes.toString("hex"))
    if (0n < n && n <= P) return bytes
  }
}

//ハッシュ値計算
const digest = (bytes, algorithm) => {
  const hash = createHash(algorithm)
  hash.update(bytes)
  return hash.digest()
}

const ripemd160 = bytes => digest(bytes, 'ripemd160')

const sha256 = bytes => digest(bytes, 'sha256')

//WIP形式のビットコインアドレス、秘密鍵生成
const generateBitcoinAddress = (prefix = '1') => {
  prefix = prefix.toLowerCase()
  while (true) {
    // 秘密鍵のバイト列を生成
    const privateKeyBytes = privateKeyCreate()

    // 公開鍵のバイト列を生成
    const publicKeyBytes = toPublic(privateKeyBytes)

    // sha256とripemd160を適用したハッシュ値(=ウォレットアドレス)を生成
    const addressBytes = ripemd160(sha256(publicKeyBytes))

    // ウォレットアドレスにプレフィクスを追加(0x00=0固定)
    const addressPrefixAdded = Buffer.concat([Buffer.alloc(1, 0), addressBytes])

    // 秘密鍵にプレフィクスを追加(メインネット=0x10=128, テストネット=0x6F=239, オプションで0x01=1を末尾につけてもOK)
    const privateKeyPrefixAdded = Buffer.concat([Buffer.alloc(1, 128), privateKeyBytes, Buffer.alloc(1, 1)])

    // ウォレットアドレスにチェックディジット(sha256を２回適用したハッシュ値の先頭4バイト)を追加
    const addressCheckAdded = Buffer.concat([addressPrefixAdded, sha256(sha256(addressPrefixAdded))], addressPrefixAdded.byteLength + 4)

    // 秘密鍵にチェックディジット(sha256を２回適用したハッシュ値の先頭4バイト)を追加
    const privateKeyCheckAdded = Buffer.concat([privateKeyPrefixAdded, sha256(sha256(privateKeyPrefixAdded))], privateKeyPrefixAdded.byteLength + 4)

    // base58でエンコードしてウォレットアドレス完成
    const address = encode(addressCheckAdded)

    // base58でエンコードして秘密鍵完成
    const privateKey = encode(privateKeyCheckAdded)

    if (address.toLowerCase().startsWith(prefix)) {
      return { publicKeyBytes, addressBytes, addressPrefixAdded, addressCheckAdded, address, privateKeyBytes, privateKeyPrefixAdded, privateKeyCheckAdded, privateKey }
    } else {
      console.log(address + ' ' + privateKey)
    }
  }
}

console.log(generateBitcoinAddress(process.argv[2] || ''))
